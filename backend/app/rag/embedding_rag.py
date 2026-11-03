
import os
import re
import json
import math
import urllib.request
import urllib.error
from pathlib import Path

import chromadb
from dotenv import load_dotenv


# Load environment variables from the project .env file
load_dotenv()


# Cloudflare Workers AI configuration
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

CLOUDFLARE_MODEL = "@cf/baai/bge-small-en-v1.5"


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate normalized embeddings using Cloudflare Workers AI."""

    if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
        raise ValueError("Cloudflare credentials are missing.")

    url = (
        f"https://api.cloudflare.com/client/v4/accounts/"
        f"{CLOUDFLARE_ACCOUNT_ID}/ai/run/{CLOUDFLARE_MODEL}"
    )

    all_embeddings = []

    # Cloudflare accepts batches of up to 100 texts.
    for start in range(0, len(texts), 100):
        batch = texts[start:start + 100]

        payload = json.dumps({
            "text": batch
        }).encode("utf-8")

        request = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                result = json.loads(
                    response.read().decode("utf-8")
                )

        except urllib.error.HTTPError as error:
            details = error.read().decode(
                "utf-8", errors="replace"
            )
            raise RuntimeError(
                f"Cloudflare embedding API error: {details}"
            ) from error

        except urllib.error.URLError as error:
            raise RuntimeError(
                f"Could not connect to Cloudflare: {error}"
            ) from error

        if not result.get("success"):
            raise RuntimeError(
                f"Cloudflare embedding failed: {result.get('errors')}"
            )

        embeddings = result["result"]["data"]

        if len(embeddings) != len(batch):
            raise RuntimeError(
                "Cloudflare returned an unexpected number of embeddings."
            )

        for embedding in embeddings:

            # Preserve the previous normalize_embeddings=True behavior.
            magnitude = math.sqrt(
                sum(value * value for value in embedding)
            )

            if magnitude == 0:
                raise RuntimeError(
                    "Cloudflare returned a zero-length embedding."
                )

            normalized = [
                value / magnitude for value in embedding
            ]

            all_embeddings.append(normalized)

    return all_embeddings


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

        # Use a separate collection for Cloudflare embeddings.
        self.collection = self.client.get_or_create_collection(
            name="it_support_sops_cloudflare",
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

        # Generate SOP embeddings using Cloudflare.
        embeddings = generate_embeddings(self.documents)

        # Remove records for SOPs that no longer exist.
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

        Returns:
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

        # Generate ticket embedding using Cloudflare.
        query_embedding = generate_embeddings([query])[0]

        # Retrieve all SOPs so category boosting can change
        # the ranking before selecting the final top results.
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
