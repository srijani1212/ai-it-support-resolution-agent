# Enterprise IT Knowledge Base & Standard Operating Procedures

---

# Escalation Matrix
**ID:** escalation-matrix  
**Category:** governance  
**Keywords:** escalate, escalation, l1, l2, l3, management, unresolved, severity, tier, human, governance  

## Purpose
Provide a clear path for escalating unresolved issues across technical tiers and managerial escalation channels.

## Support Tiers & Authority
- **L1 (Helpdesk Bot & Tier 1)**: Basic troubleshooting, automated password resets, and standard VPN tunnel restarts.
- **L2 (Tier 2 Operations)**: Complex technical problems, certificate renewals, firewall rules, ERP gateway access, and MFA token resyncs.
- **L3 (Tier 3 Engineering)**: System architects, core infrastructure engineering, or information security intervention.
- **Management (Incident Management)**: Critical outages affecting business continuity or budget approvals for hardware requisitions.

## Escalation Steps
1. Level L1: Basic troubleshooting and known issues.
2. Level L2: Complex technical problems requiring deeper expertise.
3. Level L3: System architects or security team intervention.
4. Level Management: Critical incidents affecting business continuity.
5. Identify issue severity and classify category.
6. Attempt automated resolution at current level within permitted authority.
7. Escalate to next tier immediately if unresolved or unauthorized.
8. Document all diagnostic steps and telemetry in the ticketing system.

## Notes
Ensure all escalations include a summary of actions taken, affected usernames, and environment logs.

---

# Known Outages
**ID:** known-outages  
**Category:** outage  
**Keywords:** outage, major outage, affected, impact, downtime, erp system, internal portal, file server, email outage, intermittent  

## Purpose
Document ongoing or past system outages and communication protocols for widespread service disruptions.

## Outage Runbook & Rules
1. Check known outages register for ongoing service disruptions across Email, ERP, File Server, VPN, and Internal Portal.
2. If ticket matches an active major outage, verify outage status and inform user of ongoing maintenance/restoration ETA.
3. If widespread outage is unrecorded, link ticket to master incident and escalate to L2/L3 Incident Management Team.

## Outage Incident Template
- Service affected: ERP / Email / Portal / Network
- Start time: UTC Timestamp
- End time: Estimated Restoration
- Root cause: Core infrastructure or upstream ISP
- User impact: Company-wide or Regional
- Escalation involved: Incident Commander & Tier 3 Infrastructure

---

# MFA Troubleshooting Guide
**ID:** mfa-troubleshooting  
**Category:** mfa  
**Keywords:** mfa, authenticator, sync, code, device, token, macbook, windows, verification failed, lost mfa, out of sync  

## Purpose
Resolve common multi-factor authentication issues and security token validation errors.

## Common Issues
- MFA device not registered in Active Directory
- Out-of-sync time algorithm on mobile authenticator app
- Lost, stolen, or damaged MFA hardware/phone

## Resolution Steps & Rules
1. Verify user has registered device in corporate directory.
2. Check authenticator app time synchronization and resync authenticator token.
3. Re-register device if lost or damaged following strict employee identity verification.
4. Test login with MFA and confirm token acceptance.
5. Escalate to security operations team (L2 IAM) if unresolved or suspicious activity detected.

---

# Network Firewall Issues
**ID:** network-firewall-issues  
**Category:** network  
**Keywords:** firewall, blocked, port, restricted ip, ip access, delhi, mumbai, bangalore, remote home, network timeout, timeout  

## Purpose
Identify and diagnose firewall-related network connectivity blocks and restricted regional access.

## Common Issues
- Blocked TCP/UDP ports (e.g. ERP 8080, SQL 5432)
- Unauthorized IP addresses or unwhitelisted home offices
- Misconfigured perimeter security policies

## Resolution Steps & Rules
1. Identify blocked service or destination port (e.g. ERP, Email, File Server, Internal Portal).
2. Check firewall rules, restricted office IP access (Delhi, Mumbai, Bangalore, Remote Home), and security logs.
3. Modifying firewall rules / IP allowlist requires L2 Network Administrator security authorization. Level-1 AI automated bots are strictly prohibited from changing firewall rules.
4. Promptly ESCALATE ticket to Tier 2 (L2) Network Operations & Firewall Team with diagnostic logs.

---

# Password Reset Process
**ID:** password-reset-process  
**Category:** password  
**Keywords:** password, expired, locked, reset link, credentials, change password, portal, login failed  

## Purpose
Guide automated and self-service remediation for expired or locked corporate passwords securely.

## Resolution Steps & Rules
1. Check directory password status using check_password_status().
2. If password status is 'expired' or 'locked', invoke reset_password() adhering to 12+ char mixed policy.
3. Re-verify that password_status is 'active' using check_password_status().
4. Autonomously mark ticket as RESOLVED once verified; escalate if account is suspended by IAM.

## Policy Requirements
Corporate passwords must be at least 12 characters long with uppercase, lowercase, numbers, and symbols.

---

# VPN Troubleshooting SOP
**ID:** vpn-troubleshooting-sop  
**Category:** vpn  
**Keywords:** vpn, tunnel, error code 809, error code 691, client hangs, timeout error, disconnecting, certificate  

## Purpose
Provide step-by-step instructions to resolve VPN gateway connectivity issues and certificate verification.

## Common Issues
- VPN tunnel adapter in disconnected state
- Corrupted daemon session or network socket hung
- Expired or invalid client machine certificate

## Resolution Steps & Rules
1. Verify user credentials using check_password_status().
2. Check VPN client connection state using check_vpn_status().
3. If VPN is disconnected, check certificate validity using check_certificate().
4. If the certificate is valid, restart the VPN tunnel using restart_vpn().
5. Verify the VPN connection is active.
6. If the certificate is invalid/expired, ESCALATE to Tier 2 (L2) Network Support.
7. Mark the ticket RESOLVED only after the VPN connection is verified as active.