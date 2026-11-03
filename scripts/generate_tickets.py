import json
import re

raw_tickets = [
  {
    "ticket_id": "TKT001",
    "category": "Network",
    "ticket_text": "Cannot access ERP system, possibly blocked by firewall.",
    "created_at": "2026-03-01T01:39:22.503460",
    "priority": "High"
  },
  {
    "ticket_id": "TKT002",
    "category": "Network",
    "ticket_text": "Cannot access Internal Portal, possibly blocked by firewall.",
    "created_at": "2026-03-02T20:39:22.503522",
    "priority": "High"
  },
  {
    "ticket_id": "TKT003",
    "category": "Password",
    "ticket_text": "Password expired error on login attempt.",
    "created_at": "2026-03-01T04:39:22.503538",
    "priority": "High"
  },
  {
    "ticket_id": "TKT004",
    "category": "Password",
    "ticket_text": "User cannot login after password change.",
    "created_at": "2026-03-01T23:39:22.503551",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT005",
    "category": "MFA",
    "ticket_text": "Authenticator app out of sync, user cannot login.",
    "created_at": "2026-03-02T21:39:22.503564",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT006",
    "category": "Outage",
    "ticket_text": "Major outage for VPN affecting multiple employees.",
    "created_at": "2026-03-02T01:39:22.503577",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT007",
    "category": "Outage",
    "ticket_text": "Email outage reported from Bangalore office.",
    "created_at": "2026-03-01T00:39:22.503590",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT008",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Remote home.",
    "created_at": "2026-03-01T09:39:22.503603",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT009",
    "category": "VPN",
    "ticket_text": "VPN timeout error for user user5.",
    "created_at": "2026-03-03T15:39:22.503615",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT010",
    "category": "Password",
    "ticket_text": "Unable to reset password on corporate portal.",
    "created_at": "2026-03-01T12:39:22.503627",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT011",
    "category": "Outage",
    "ticket_text": "Major outage for ERP system affecting multiple employees.",
    "created_at": "2026-03-02T01:39:22.503640",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT012",
    "category": "MFA",
    "ticket_text": "MFA code not accepted on MacBook Pro.",
    "created_at": "2026-02-28T18:39:22.503671",
    "priority": "High"
  },
  {
    "ticket_id": "TKT013",
    "category": "Network",
    "ticket_text": "Firewall blocked traffic to Email.",
    "created_at": "2026-03-01T04:39:22.503687",
    "priority": "High"
  },
  {
    "ticket_id": "TKT014",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Delhi office.",
    "created_at": "2026-03-02T18:39:22.503699",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT015",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Bangalore office.",
    "created_at": "2026-03-02T12:39:22.503711",
    "priority": "High"
  },
  {
    "ticket_id": "TKT016",
    "category": "VPN",
    "ticket_text": "Unable to establish VPN connection from Remote home.",
    "created_at": "2026-03-03T14:39:22.503724",
    "priority": "High"
  },
  {
    "ticket_id": "TKT017",
    "category": "Outage",
    "ticket_text": "Major outage for ERP system affecting multiple employees.",
    "created_at": "2026-03-01T15:39:22.503735",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT018",
    "category": "Network",
    "ticket_text": "Firewall blocked traffic to ERP system.",
    "created_at": "2026-03-02T10:39:22.503749",
    "priority": "High"
  },
  {
    "ticket_id": "TKT019",
    "category": "Password",
    "ticket_text": "Password expired error on login attempt.",
    "created_at": "2026-03-01T02:39:22.503761",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT020",
    "category": "Network",
    "ticket_text": "Cannot access File Server, possibly blocked by firewall.",
    "created_at": "2026-03-02T01:39:22.503773",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT021",
    "category": "VPN",
    "ticket_text": "Unable to establish VPN connection from Delhi office.",
    "created_at": "2026-03-01T15:39:22.503784",
    "priority": "High"
  },
  {
    "ticket_id": "TKT022",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Mumbai office.",
    "created_at": "2026-03-01T08:39:22.503811",
    "priority": "High"
  },
  {
    "ticket_id": "TKT023",
    "category": "Password",
    "ticket_text": "Password reset link not working for user user3.",
    "created_at": "2026-02-28T23:39:22.503843",
    "priority": "High"
  },
  {
    "ticket_id": "TKT024",
    "category": "Network",
    "ticket_text": "Network timeout when connecting to Email.",
    "created_at": "2026-02-28T17:39:22.503857",
    "priority": "High"
  },
  {
    "ticket_id": "TKT025",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Remote home.",
    "created_at": "2026-03-01T17:39:22.503869",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT026",
    "category": "VPN",
    "ticket_text": "VPN not connecting on Windows 10 PC with error code 809.",
    "created_at": "2026-03-02T03:39:22.503881",
    "priority": "High"
  },
  {
    "ticket_id": "TKT027",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Bangalore office.",
    "created_at": "2026-03-02T01:39:22.503894",
    "priority": "High"
  },
  {
    "ticket_id": "TKT028",
    "category": "Password",
    "ticket_text": "Unable to reset password on corporate portal.",
    "created_at": "2026-03-02T03:39:22.503905",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT029",
    "category": "MFA",
    "ticket_text": "MFA code not accepted on Windows 11 laptop.",
    "created_at": "2026-03-02T18:39:22.503917",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT030",
    "category": "Password",
    "ticket_text": "Password reset link not working for user user7.",
    "created_at": "2026-03-02T03:39:22.503966",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT031",
    "category": "VPN",
    "ticket_text": "VPN client hangs when trying to connect from MacBook Pro.",
    "created_at": "2026-03-01T12:39:22.503978",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT032",
    "category": "MFA",
    "ticket_text": "Lost MFA device, cannot authenticate.",
    "created_at": "2026-03-02T00:39:22.503989",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT033",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Delhi office.",
    "created_at": "2026-03-03T12:39:22.504001",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT034",
    "category": "VPN",
    "ticket_text": "VPN client hangs when trying to connect from MacBook Pro.",
    "created_at": "2026-03-01T06:39:22.504015",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT035",
    "category": "Network",
    "ticket_text": "Network timeout when connecting to Internal Portal.",
    "created_at": "2026-03-01T13:39:22.504027",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT036",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Remote home.",
    "created_at": "2026-03-02T19:39:22.504056",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT037",
    "category": "Password",
    "ticket_text": "Password reset link not working for user user10.",
    "created_at": "2026-03-02T13:39:22.504089",
    "priority": "High"
  },
  {
    "ticket_id": "TKT038",
    "category": "MFA",
    "ticket_text": "Lost MFA device, cannot authenticate.",
    "created_at": "2026-03-03T01:39:22.504100",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT039",
    "category": "Outage",
    "ticket_text": "Users unable to access File Server since 2026-02-28 20:39.",
    "created_at": "2026-03-01T15:39:22.504112",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT040",
    "category": "Password",
    "ticket_text": "Password expired error on login attempt.",
    "created_at": "2026-03-01T17:39:22.504123",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT041",
    "category": "Password",
    "ticket_text": "User cannot login after password change.",
    "created_at": "2026-03-02T12:39:22.504134",
    "priority": "High"
  },
  {
    "ticket_id": "TKT042",
    "category": "MFA",
    "ticket_text": "Authenticator app out of sync, user cannot login.",
    "created_at": "2026-03-01T18:39:22.504146",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT043",
    "category": "Outage",
    "ticket_text": "ERP system outage reported from Bangalore office.",
    "created_at": "2026-03-03T08:39:22.504160",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT044",
    "category": "MFA",
    "ticket_text": "Lost MFA device, cannot authenticate.",
    "created_at": "2026-02-28T19:39:22.504172",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT045",
    "category": "Network",
    "ticket_text": "Cannot access Email, possibly blocked by firewall.",
    "created_at": "2026-02-28T20:39:22.504183",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT046",
    "category": "Outage",
    "ticket_text": "VPN outage reported from Mumbai office.",
    "created_at": "2026-03-01T02:39:22.504197",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT047",
    "category": "VPN",
    "ticket_text": "VPN not connecting on MacBook Pro with error code 691.",
    "created_at": "2026-03-01T13:39:22.504225",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT048",
    "category": "Network",
    "ticket_text": "Network timeout when connecting to Email.",
    "created_at": "2026-03-01T11:39:22.504259",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT049",
    "category": "MFA",
    "ticket_text": "MFA code not accepted on Windows 11 laptop.",
    "created_at": "2026-03-03T11:39:22.504270",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT050",
    "category": "MFA",
    "ticket_text": "MFA verification failed for user user20.",
    "created_at": "2026-03-01T23:39:22.504282",
    "priority": "High"
  },
  {
    "ticket_id": "TKT051",
    "category": "MFA",
    "ticket_text": "Lost MFA device, cannot authenticate.",
    "created_at": "2026-03-02T11:39:22.504294",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT052",
    "category": "Network",
    "ticket_text": "Cannot access Email, possibly blocked by firewall.",
    "created_at": "2026-03-01T21:39:22.504323",
    "priority": "High"
  },
  {
    "ticket_id": "TKT053",
    "category": "MFA",
    "ticket_text": "MFA verification failed for user user13.",
    "created_at": "2026-03-01T19:39:22.504356",
    "priority": "High"
  },
  {
    "ticket_id": "TKT054",
    "category": "MFA",
    "ticket_text": "Authenticator app out of sync, user cannot login.",
    "created_at": "2026-03-01T00:39:22.504368",
    "priority": "High"
  },
  {
    "ticket_id": "TKT055",
    "category": "Password",
    "ticket_text": "Unable to reset password on corporate portal.",
    "created_at": "2026-03-02T04:39:22.504379",
    "priority": "High"
  },
  {
    "ticket_id": "TKT056",
    "category": "Outage",
    "ticket_text": "Major outage for Internal Portal affecting multiple employees.",
    "created_at": "2026-03-01T12:39:22.504391",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT057",
    "category": "Network",
    "ticket_text": "Firewall blocked traffic to ERP system.",
    "created_at": "2026-03-02T14:39:22.504404",
    "priority": "High"
  },
  {
    "ticket_id": "TKT058",
    "category": "Outage",
    "ticket_text": "Intermittent connectivity issues on File Server reported.",
    "created_at": "2026-03-02T08:39:22.504416",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT059",
    "category": "VPN",
    "ticket_text": "Unable to establish VPN connection from Delhi office.",
    "created_at": "2026-03-02T05:39:22.504443",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT060",
    "category": "MFA",
    "ticket_text": "MFA verification failed for user user5.",
    "created_at": "2026-02-28T18:39:22.504476",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT061",
    "category": "Password",
    "ticket_text": "User cannot login after password change.",
    "created_at": "2026-03-02T15:39:22.504488",
    "priority": "High"
  },
  {
    "ticket_id": "TKT062",
    "category": "Password",
    "ticket_text": "Unable to reset password on corporate portal.",
    "created_at": "2026-03-01T15:39:22.504501",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT063",
    "category": "Network",
    "ticket_text": "Cannot access ERP system, possibly blocked by firewall.",
    "created_at": "2026-03-01T05:39:22.504512",
    "priority": "High"
  },
  {
    "ticket_id": "TKT064",
    "category": "Outage",
    "ticket_text": "Major outage for File Server affecting multiple employees.",
    "created_at": "2026-02-28T22:39:22.504560",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT065",
    "category": "Password",
    "ticket_text": "Password expired error on login attempt.",
    "created_at": "2026-03-02T05:39:22.504572",
    "priority": "High"
  },
  {
    "ticket_id": "TKT066",
    "category": "Outage",
    "ticket_text": "VPN outage reported from Delhi office.",
    "created_at": "2026-03-02T19:39:22.504584",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT067",
    "category": "Password",
    "ticket_text": "Password reset link not working for user user1.",
    "created_at": "2026-03-02T22:39:22.504596",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT068",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Delhi office.",
    "created_at": "2026-03-03T11:39:22.504608",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT069",
    "category": "MFA",
    "ticket_text": "MFA code not accepted on Windows 10 PC.",
    "created_at": "2026-03-02T05:39:22.504620",
    "priority": "High"
  },
  {
    "ticket_id": "TKT070",
    "category": "Password",
    "ticket_text": "Unable to reset password on corporate portal.",
    "created_at": "2026-02-28T21:39:22.504634",
    "priority": "High"
  },
  {
    "ticket_id": "TKT071",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Remote home.",
    "created_at": "2026-03-02T20:39:22.504662",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT072",
    "category": "Outage",
    "ticket_text": "Major outage for Email affecting multiple employees.",
    "created_at": "2026-03-01T11:39:22.504697",
    "priority": "High"
  },
  {
    "ticket_id": "TKT073",
    "category": "VPN",
    "ticket_text": "VPN client hangs when trying to connect from Windows 10 PC.",
    "created_at": "2026-02-28T18:39:22.504709",
    "priority": "High"
  },
  {
    "ticket_id": "TKT074",
    "category": "MFA",
    "ticket_text": "Lost MFA device, cannot authenticate.",
    "created_at": "2026-03-01T18:39:22.504721",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT075",
    "category": "Outage",
    "ticket_text": "Intermittent connectivity issues on VPN reported.",
    "created_at": "2026-03-03T04:39:22.504733",
    "priority": "High"
  },
  {
    "ticket_id": "TKT076",
    "category": "VPN",
    "ticket_text": "VPN not connecting on Windows 10 PC with error code 691.",
    "created_at": "2026-03-01T06:39:22.504745",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT077",
    "category": "MFA",
    "ticket_text": "Authenticator app out of sync, user cannot login.",
    "created_at": "2026-03-03T04:39:22.504757",
    "priority": "High"
  },
  {
    "ticket_id": "TKT078",
    "category": "Network",
    "ticket_text": "Network timeout when connecting to ERP system.",
    "created_at": "2026-03-02T04:39:22.504771",
    "priority": "High"
  },
  {
    "ticket_id": "TKT079",
    "category": "Network",
    "ticket_text": "Network timeout when connecting to ERP system.",
    "created_at": "2026-03-01T11:39:22.504784",
    "priority": "High"
  },
  {
    "ticket_id": "TKT080",
    "category": "VPN",
    "ticket_text": "VPN timeout error for user user3.",
    "created_at": "2026-03-03T13:39:22.504796",
    "priority": "High"
  },
  {
    "ticket_id": "TKT081",
    "category": "MFA",
    "ticket_text": "MFA verification failed for user user3.",
    "created_at": "2026-03-02T10:39:22.504807",
    "priority": "High"
  },
  {
    "ticket_id": "TKT082",
    "category": "MFA",
    "ticket_text": "Lost MFA device, cannot authenticate.",
    "created_at": "2026-03-01T11:39:22.504819",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT083",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Delhi office.",
    "created_at": "2026-03-01T10:39:22.504830",
    "priority": "High"
  },
  {
    "ticket_id": "TKT084",
    "category": "Network",
    "ticket_text": "Firewall blocked traffic to ERP system.",
    "created_at": "2026-02-28T18:39:22.504842",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT085",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Delhi office.",
    "created_at": "2026-03-01T05:39:22.504890",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT086",
    "category": "MFA",
    "ticket_text": "MFA code not accepted on Windows 10 PC.",
    "created_at": "2026-03-02T18:39:22.504902",
    "priority": "High"
  },
  {
    "ticket_id": "TKT087",
    "category": "Password",
    "ticket_text": "Password reset link not working for user user20.",
    "created_at": "2026-02-28T18:39:22.504913",
    "priority": "High"
  },
  {
    "ticket_id": "TKT088",
    "category": "MFA",
    "ticket_text": "MFA code not accepted on Windows 11 laptop.",
    "created_at": "2026-03-02T05:39:22.504925",
    "priority": "High"
  },
  {
    "ticket_id": "TKT089",
    "category": "Password",
    "ticket_text": "User cannot login after password change.",
    "created_at": "2026-03-01T03:39:22.504936",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT090",
    "category": "Network",
    "ticket_text": "Network timeout when connecting to File Server.",
    "created_at": "2026-02-28T23:39:22.504948",
    "priority": "High"
  },
  {
    "ticket_id": "TKT091",
    "category": "Outage",
    "ticket_text": "Major outage for Internal Portal affecting multiple employees.",
    "created_at": "2026-03-02T04:39:22.504959",
    "priority": "High"
  },
  {
    "ticket_id": "TKT092",
    "category": "Outage",
    "ticket_text": "Intermittent connectivity issues on File Server reported.",
    "created_at": "2026-03-02T00:39:22.504971",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT093",
    "category": "VPN",
    "ticket_text": "VPN client hangs when trying to connect from MacBook Pro.",
    "created_at": "2026-03-01T16:39:22.504983",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT094",
    "category": "Network",
    "ticket_text": "Restricted IP access prevents login from Remote home.",
    "created_at": "2026-03-01T01:39:22.504996",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT095",
    "category": "Outage",
    "ticket_text": "Users unable to access Email since 2026-03-01 20:39.",
    "created_at": "2026-03-01T09:39:22.505008",
    "priority": "High"
  },
  {
    "ticket_id": "TKT096",
    "category": "Password",
    "ticket_text": "Unable to reset password on corporate portal.",
    "created_at": "2026-03-01T21:39:22.505021",
    "priority": "High"
  },
  {
    "ticket_id": "TKT097",
    "category": "Outage",
    "ticket_text": "VPN outage reported from Remote home.",
    "created_at": "2026-03-01T07:39:22.505034",
    "priority": "Medium"
  },
  {
    "ticket_id": "TKT098",
    "category": "Outage",
    "ticket_text": "Major outage for Internal Portal affecting multiple employees.",
    "created_at": "2026-03-02T03:39:22.505046",
    "priority": "High"
  },
  {
    "ticket_id": "TKT099",
    "category": "Outage",
    "ticket_text": "ERP system outage reported from Remote home.",
    "created_at": "2026-03-01T03:39:22.505058",
    "priority": "Low"
  },
  {
    "ticket_id": "TKT100",
    "category": "Network",
    "ticket_text": "Network timeout when connecting to Email.",
    "created_at": "2026-03-03T07:39:22.505070",
    "priority": "Medium"
  }
]

def make_title(text):
    text = text.strip()
    if text.endswith('.'):
        text = text[:-1]
    return text

def make_reporter(ticket):
    text = ticket['ticket_text']
    tid = ticket['ticket_id']
    # Match explicit usernames such as user1, user3, user10, user20
    user_match = re.search(r'\b(user\d+)\b', text, re.I)
    office_match = re.search(r'(Delhi office|Mumbai office|Bangalore office|Remote home)', text, re.I)
    
    # Generate clean employee id from ticket number (e.g. TKT004 -> emp_1004)
    num_part = re.sub(r'\D', '', tid).lstrip('0')
    emp_num = str(1000 + int(num_part)) if num_part else "1001"
    
    if user_match:
        uname = user_match.group(1).lower()
    else:
        uname = f"emp_{emp_num}"
        
    loc = office_match.group(1) if office_match else "Corporate HQ"
    return f"{uname} ({loc})"

def make_sla(priority):
    if priority == "High":
        return {
            "targetResolutionMinutes": 15,
            "targetResponseMinutes": 5,
            "resolutionTimeLabel": "15 mins",
            "responseTimeLabel": "< 5 mins",
            "status": "On-Track",
            "remainingMinutes": 12,
            "elapsedMinutes": 3,
            "complianceRate": "99.8%",
            "tier": "Tier 1 (Automated AI Resolution)"
        }
    elif priority == "Medium":
        return {
            "targetResolutionMinutes": 60,
            "targetResponseMinutes": 15,
            "resolutionTimeLabel": "1 hour",
            "responseTimeLabel": "< 15 mins",
            "status": "On-Track",
            "remainingMinutes": 48,
            "elapsedMinutes": 12,
            "complianceRate": "98.5%",
            "tier": "Tier 2 (Standard Support SLA)"
        }
    else:
        return {
            "targetResolutionMinutes": 240,
            "targetResponseMinutes": 30,
            "resolutionTimeLabel": "4 hours",
            "responseTimeLabel": "< 30 mins",
            "status": "On-Track",
            "remainingMinutes": 210,
            "elapsedMinutes": 30,
            "complianceRate": "99.2%",
            "tier": "Tier 3 (Extended Operations)"
        }

def make_initial_env(cat):
    cat_lower = cat.lower()
    base = {
        "vpn_connected": True,
        "certificate_valid": True,
        "password_status": "active",
        "vpn_service_healthy": True,
        "disk_usage_percent": 38,
        "disk_free_gb": 310,
        "print_spooler_status": "online",
        "pending_print_jobs": 0
    }
    if cat_lower == "password":
        base["password_status"] = "expired"
    elif cat_lower == "vpn":
        base["vpn_connected"] = False
    elif cat_lower == "outage":
        base["vpn_service_healthy"] = False
        base["vpn_connected"] = False
    elif cat_lower == "network":
        base["vpn_connected"] = True
    elif cat_lower == "mfa":
        base["password_status"] = "active"
    return base

def make_approval_hierarchy(ticket):
    cat = ticket['category']
    return [
        {
            "level": 1,
            "role": "L1: AI Helpdesk Triage Engine",
            "approverName": "Autonomous Remediation Bot",
            "department": "IT Operations",
            "status": "approved",
            "timestamp": "08:30:00 AM",
            "decisionNote": f"SOP-{cat.upper()}-01 Verified: Incident evaluated under automated enterprise runbook."
        },
        {
            "level": 2,
            "role": "L2: Technical Support Specialist",
            "approverName": "Network & IAM Lead",
            "department": "Infrastructure Services",
            "status": "auto_waived" if ticket['priority'] != 'High' else "pending",
            "timestamp": "08:30:10 AM",
            "decisionNote": "Escalation standby in accordance with Escalation Matrix."
        },
        {
            "level": 3,
            "role": "L3: System Architects & Security Team",
            "approverName": "Marcus Vance",
            "department": "IT InfoSec & Architecture",
            "status": "pending",
            "decisionNote": "Governance & business continuity sign-off."
        }
    ]

enriched_tickets = []
for t in raw_tickets:
    tid = t["ticket_id"]
    cat = t["category"].lower()
    prio = t["priority"]
    text = t["ticket_text"]
    
    scenario_item = {
        "id": tid.lower(),
        "ticketId": tid,
        "ticket_id": tid,
        "title": make_title(text),
        "category": cat,
        "priority": prio,
        "reporter": make_reporter(t),
        "ticket": text,
        "ticket_text": text,
        "created_at": t["created_at"],
        "description": f"{t['category']} ticket from employee requiring IT support.",
        "initialEnv": make_initial_env(cat),
        "sla": make_sla(prio),
        "approvalHierarchy": make_approval_hierarchy(t)
    }
    enriched_tickets.append(scenario_item)

with open("src/data/tickets.json", "w") as f:
    json.dump(enriched_tickets, f, indent=2)

print(f"Successfully wrote {len(enriched_tickets)} tickets to /src/data/tickets.json")
