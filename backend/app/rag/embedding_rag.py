
import os
import re
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer


# Existing knowledge-base location
KB_PATH = (
    Path(__file__).resolve().parents[3]
    / "src"
    / "data"
    / "knowledge_base.md"
)

# Persistent ChromaDB storage location
DEFAULT_CHROMA_PATH = (
    Path(__file__).resolve().parents[2] / "chroma_data"
)

CHROMA_PATH = Path(
    os.getenv("CHROMA_PERSIST_DIR", str(DEFAULT_CHROMA_PATH))
).resolve()


class EmbeddingRAG:
    def __init__(self, top_k: int = 2):
        self.top_k = top_k

        # Keep the existing embedding model
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

        # Load SOP articles
        self.documents = self._load_documents()

        if not self.documents:
            raise ValueError(
                f"No knowledge-base documents found at: {KB_PATH}"
            )

        # Create a persistent ChromaDB client.
        # Data remains stored between backend restarts.
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)

        self.client = chromadb.PersistentClient(
            path=str(CHROMA_PATH)
        )

        # Use cosine distance for vector similarity search.
        # We supply our own embeddings, so ChromaDB does not
        # need to generate embeddings itself.
        self.collection = self.client.get_or_create_collection(
            name="it_support_sops",
            metadata={"hnsw:space": "cosine"},
            embedding_function=None,
        )

        # Add new SOPs, update changed SOPs and remove deleted SOPs.
        self._sync_documents()

    def _load_documents(self) -> list[str]:
        """Load each top-level SOP article as one document."""

        if not KB_PATH.exists():
            raise FileNotFoundError(
                f"Knowledge base file not found at: {KB_PATH}"
            )

        text = KB_PATH.read_text(encoding="utf-8")

        # Split only on level-one headings, keeping subsections
        # inside their parent SOP.
        sections = re.split(r"\n(?=# )", text)

        return [
            section.strip()
            for section in sections
            if section.strip() and "**ID:**" in section
        ]

    def _get_document_id(
        self, document: str, index: int
    ) -> str:
        """Use the SOP's existing ID as its ChromaDB document ID."""

        for line in document.splitlines():
            if line.lower().strip().startswith("**id:**"):
                document_id = line.split(":", 1)[1].strip()

                if document_id:
                    return document_id

        return f"sop-{index}"

    def _get_category(self, document: str) -> str:
        """Extract the category metadata from an SOP."""

        for line in document.splitlines():
            if line.lower().strip().startswith("**category:**"):
                return line.split(":", 1)[1].strip().lower()

        return "unknown"

    def _sync_documents(self) -> None:
        """Synchronize the knowledge base with ChromaDB."""

        ids = [
            self._get_document_id(document, index)
            for index, document in enumerate(self.documents)
        ]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Duplicate SOP IDs found in knowledge_base.md"
            )

        metadatas = [
            {
                "category": self._get_category(document),
                "source": "knowledge_base.md",
                "title": document.splitlines()[0].lstrip("# ").strip(),
            }
            for document in self.documents
        ]

        # Generate embeddings with the existing model.
        embeddings = self.model.encode(
            self.documents,
            normalize_embeddings=True,
            convert_to_numpy=True,
        ).tolist()

        # Remove records for SOPs that no longer exist in the file.
        existing_ids = self.collection.get(include=[])["ids"]
        current_ids = set(ids)

        stale_ids = [
            document_id
            for document_id in existing_ids
            if document_id not in current_ids
        ]

        if stale_ids:
            self.collection.delete(ids=stale_ids)

        # Upsert inserts new SOPs and updates existing SOPs.
        self.collection.upsert(
            ids=ids,
            documents=self.documents,
            metadatas=metadatas,
            embeddings=embeddings,
        )

    def _detect_issue_type(self, query: str) -> str | None:
        """Detect a likely IT issue category from a ticket."""

        query_lower = query.lower()

        keyword_groups = {
            "vpn": [
                "vpn",
                "virtual private network",
                "vpn disconnected",
                "vpn connection",
                "vpn tunnel",
                "vpn client",
                "vpn timeout",
                "vpn certificate",
                "vpn not connecting",
                "cannot connect to vpn",
                "can't connect to vpn",
            ],
            "password": [
                "password",
                "password expired",
                "password reset",
                "login password",
                "locked account",
                "expired password",
                "cannot login",
                "can't login",
            ],
            "mfa": [
                "mfa",
                "multi-factor",
                "multi factor",
                "authenticator",
                "otp",
                "verification code",
                "token",
            ],
            "network": [
                "firewall",
                "blocked",
                "blocked port",
                "restricted ip",
                "ip access",
                "network timeout",
                "network issue",
                "connection timeout",
                "firewall blocked",
                "erp gateway",
            ],
            "outage": [
                "outage",
                "major outage",
                "downtime",
                "service outage",
                "intermittent outage",
                "service unavailable",
                "multiple users affected",
                "everyone is affected",
                "all users affected",
            ],
        }

        # Preserve the original category priority.
        category_priority = [
            "vpn",
            "password",
            "mfa",
            "network",
            "outage",
        ]

        for issue_type in category_priority:
            if any(
                keyword in query_lower
                for keyword in keyword_groups[issue_type]
            ):
                return issue_type

        return None

    def retrieve_scored(
        self,
        query: str,
        top_k: int | None = None,
    ) -> list[dict[str, str | float]]:
        """
        Retrieve relevant SOPs from ChromaDB.

        Returns the same structure as the previous FAISS version:
        [{"content": "...", "score": 0.95}, ...]
        """

        if not query or not query.strip():
            return []

        requested_top_k = (
            self.top_k if top_k is None else top_k
        )

        if requested_top_k <= 0:
            return []

        document_count = self.collection.count()

        if document_count == 0:
            return []

        # Embed the ticket using the same model used for SOPs.
        query_embedding = self.model.encode(
            [query],
            normalize_embeddings=True,
            convert_to_numpy=True,
        )[0].tolist()

        # Retrieve all SOPs so category boosting can change
        # the ranking before we select the final top results.
        matches = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=document_count,
            include=["documents", "metadatas", "distances"],
        )

        documents = matches["documents"][0]
        metadatas = matches["metadatas"][0]
        distances = matches["distances"][0]

        detected_issue_type = self._detect_issue_type(query)
        results: list[dict[str, str | float]] = []

        for document, metadata, distance in zip(
            documents, metadatas, distances
        ):
            # Cosine distance = 1 - cosine similarity.
            # Convert it back to a similarity-style score.
            score = 1.0 - float(distance)

            category = metadata.get("category", "unknown")

            # Preserve the existing category boost.
            if (
                detected_issue_type
                and category == detected_issue_type
            ):
                score += 1.50

            results.append(
                {
                    "content": document,
                    "score": score,
                }
            )

        # Rank after applying category boosts.
        results.sort(
            key=lambda result: result["score"],
            reverse=True,
        )

        return results[:requested_top_k]


# Shared instance used by the existing LangGraph agent nodes
embedding_rag = EmbeddingRAG()
