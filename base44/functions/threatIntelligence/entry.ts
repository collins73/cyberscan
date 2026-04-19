import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { mode, vulnerabilities, language, scan_id } = body;

    if (mode === 'enrich_single') {
      // Deep enrich one vulnerability with real-time threat feeds
      const vuln = vulnerabilities[0];
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a senior threat intelligence analyst with access to real-time security feeds including CISA KEV, NVD, MITRE ATT&CK, and ExploitDB.

Perform a comprehensive threat intelligence analysis for the following vulnerability:

Title: ${vuln.title}
Severity: ${vuln.severity}
Language: ${language || 'Unknown'}
Description: ${vuln.description}

Provide deep threat intelligence including:
1. Known CVE identifiers with CVSS v3.1 scores (fetch real CVEs if applicable)
2. Whether this vulnerability type appears in the CISA Known Exploited Vulnerabilities catalog
3. Active threat actor groups known to exploit this vulnerability class (use real APT group names like APT28, Lazarus, FIN7, etc.)
4. Recent exploit availability — PoC on GitHub, Metasploit modules, ExploitDB entries
5. Real-world attack campaigns using this vulnerability (with approximate dates)
6. MITRE ATT&CK technique mappings (T-codes)
7. Exploitation frequency score 0-100 based on observed activity
8. Risk-adjusted priority score 0-100 (combines severity + exploitability + threat actor activity)
9. Specific contextual remediation advice based on current threat landscape
10. Detection rules / IOCs if available`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            cves: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cve_id: { type: 'string' },
                  cvss_score: { type: 'number' },
                  cvss_vector: { type: 'string' },
                  description: { type: 'string' },
                  published_date: { type: 'string' },
                  in_cisa_kev: { type: 'boolean' },
                  kev_date_added: { type: 'string' }
                }
              }
            },
            threat_actors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  origin: { type: 'string' },
                  activity_level: { type: 'string' },
                  last_seen: { type: 'string' },
                  campaign_name: { type: 'string' }
                }
              }
            },
            exploit_availability: {
              type: 'object',
              properties: {
                has_public_exploit: { type: 'boolean' },
                exploitdb_ids: { type: 'array', items: { type: 'string' } },
                metasploit_module: { type: 'string' },
                github_pocs: { type: 'array', items: { type: 'string' } },
                ease_of_exploitation: { type: 'string' }
              }
            },
            mitre_attack: {
              type: 'object',
              properties: {
                techniques: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      technique_id: { type: 'string' },
                      technique_name: { type: 'string' },
                      tactic: { type: 'string' }
                    }
                  }
                }
              }
            },
            attack_campaigns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  campaign_name: { type: 'string' },
                  date: { type: 'string' },
                  industry_targets: { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' }
                }
              }
            },
            exploitation_frequency: { type: 'number' },
            risk_priority_score: { type: 'number' },
            threat_summary: { type: 'string' },
            contextual_remediation: { type: 'string' },
            detection_rules: { type: 'array', items: { type: 'string' } },
            iocs: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      return Response.json({ intel: result });
    }

    if (mode === 'prioritize_scan') {
      // Prioritize all vulnerabilities in a scan by real-world threat activity
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a threat intelligence analyst. Given these ${vulnerabilities.length} vulnerabilities from a ${language} codebase, prioritize them based on REAL-WORLD threat actor activity, CISA KEV presence, exploit availability, and active campaigns.

Vulnerabilities:
${vulnerabilities.map((v, i) => `${i + 1}. [${v.severity.toUpperCase()}] ${v.title}: ${v.description}`).join('\n')}

For EACH vulnerability, provide:
- A risk_priority_score (0-100) that combines severity + real-world exploitability + active threat campaigns
- Whether it's in CISA KEV
- Active threat actors targeting this vulnerability class
- Recommended fix urgency (immediate/within_7_days/within_30_days/next_sprint)
- One key contextual remediation insight

Order the results by risk_priority_score descending.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            prioritized_vulnerabilities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  original_title: { type: 'string' },
                  original_severity: { type: 'string' },
                  risk_priority_score: { type: 'number' },
                  in_cisa_kev: { type: 'boolean' },
                  active_threat_actors: { type: 'array', items: { type: 'string' } },
                  has_public_exploit: { type: 'boolean' },
                  fix_urgency: { type: 'string' },
                  key_insight: { type: 'string' }
                }
              }
            },
            overall_threat_level: { type: 'string' },
            top_risk_summary: { type: 'string' }
          }
        }
      });
      return Response.json({ prioritization: result });
    }

    if (mode === 'threat_landscape') {
      // Get current threat landscape for a given language/tech stack
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a threat intelligence analyst. Provide the current (2025-2026) threat landscape for ${language || 'general web application'} security.

Include:
1. Top 5 most actively exploited vulnerability types in this tech stack RIGHT NOW
2. Most active APT groups targeting ${language || 'web'} applications
3. Recent zero-day or newly disclosed vulnerabilities (last 90 days)
4. Industry-specific threat actors if applicable
5. Trending attack techniques from MITRE ATT&CK
6. Overall risk level assessment`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            top_exploited_vulns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  vuln_type: { type: 'string' },
                  cve_example: { type: 'string' },
                  exploitation_rate: { type: 'string' },
                  threat_actors: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            active_apt_groups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  origin: { type: 'string' },
                  primary_targets: { type: 'array', items: { type: 'string' } },
                  recent_activity: { type: 'string' }
                }
              }
            },
            recent_zero_days: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cve_id: { type: 'string' },
                  description: { type: 'string' },
                  severity: { type: 'string' },
                  disclosed_date: { type: 'string' }
                }
              }
            },
            trending_techniques: { type: 'array', items: { type: 'string' } },
            overall_risk_level: { type: 'string' },
            landscape_summary: { type: 'string' }
          }
        }
      });
      return Response.json({ landscape: result });
    }

    return Response.json({ error: 'Unknown mode' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});