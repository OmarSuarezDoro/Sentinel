-- Preserve communication links for reports created before relational report items.
INSERT INTO "ReportItem" ("id", "clientId", "reportId", "recordId", "snapshot", "communicatedAt")
SELECT gen_random_uuid()::text, p."clientId", p."id", r."id", item,
 CASE WHEN p."status" = 'sent' THEN p."sentAt" ELSE NULL END
FROM "Report" p
CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p."snapshot"->'items') = 'array' THEN p."snapshot"->'items' ELSE '[]'::jsonb END) item
JOIN "Record" r ON r."id" = item->>'id' AND r."clientId" = p."clientId"
ON CONFLICT ("reportId", "recordId") DO NOTHING;

-- Existing network inventory remains queryable as normalized VLAN records.
INSERT INTO "Vlan" ("id", "clientId", "networkId", "vlanId", "name", "description")
SELECT gen_random_uuid()::text, r."clientId", r."id",
 CASE WHEN r."data"->>'vlan' ~ '^[0-9]{1,4}$' THEN (r."data"->>'vlan')::int END,
 r."title", COALESCE(r."data"->>'description', '')
FROM "Record" r
WHERE r."kind" = 'networks'
 AND CASE WHEN r."data"->>'vlan' ~ '^[0-9]{1,4}$' THEN (r."data"->>'vlan')::int END BETWEEN 1 AND 4094
ON CONFLICT ("networkId") DO NOTHING;
