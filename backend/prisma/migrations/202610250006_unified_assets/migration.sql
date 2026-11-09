/**
 * @file: migration.sql
 * @description: Inventario normalizado e índice de búsqueda transversal
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE "Record" ADD COLUMN "assetType" TEXT, ADD COLUMN "searchText" TEXT NOT NULL DEFAULT '';
UPDATE "Record" SET "assetType"=CASE WHEN kind='networks' THEN 'network' WHEN kind='identities' THEN 'identity' ELSE CASE data->>'category' WHEN 'Servidor' THEN 'server' WHEN 'Endpoint' THEN 'endpoint' WHEN 'Firewall' THEN 'firewall' WHEN 'Switch / Router' THEN 'network_device' WHEN 'Cloud' THEN 'cloud' WHEN 'Web' THEN 'web' WHEN 'Aplicación' THEN 'application' WHEN 'Base de datos' THEN 'database' WHEN 'Red' THEN 'network' WHEN 'Identidad' THEN 'identity' ELSE 'other' END END WHERE kind IN ('assets','networks','identities');
UPDATE "Record" SET data=data||jsonb_build_object('category',CASE kind WHEN 'networks' THEN 'Red' ELSE 'Identidad' END),kind='assets' WHERE kind IN ('networks','identities');
ALTER TABLE "Record" ADD CONSTRAINT "Record_asset_kind_check" CHECK (kind NOT IN ('networks','identities'));
ALTER TABLE "Record" ADD CONSTRAINT "Record_asset_type_check" CHECK ((kind='assets' AND "assetType" IS NOT NULL AND "assetType" IN ('server','endpoint','network','identity','firewall','network_device','cloud','web','application','database','other')) OR (kind<>'assets' AND "assetType" IS NULL));
CREATE INDEX "Record_clientId_kind_assetType_archived_idx" ON "Record"("clientId","kind","assetType","archived");
CREATE INDEX "Record_searchText_trgm_idx" ON "Record" USING GIN("searchText" gin_trgm_ops);
CREATE FUNCTION mssp_build_search(item "Record") RETURNS TEXT LANGUAGE SQL STABLE AS $$
 SELECT lower(concat_ws(' ',(item).id,(item).title,(item).owner,(item)."assetType",(item).status,(item).severity,
 jsonb_path_query_array((item).data,'$.** ? (@.type() == "string" || @.type() == "number" || @.type() == "boolean")')::text,
 (SELECT string_agg(concat_ws(' ',name,platform,type,authentication,mfa,privileges,status,reviewer),' ') FROM "Account" WHERE "identityId"=(item).id AND NOT archived),
 (SELECT string_agg(concat_ws(' ',system,role,privileges,status,reviewer),' ') FROM "AccessGrant" WHERE "identityId"=(item).id AND NOT archived),
 (SELECT string_agg(concat_ws(' ',name,address,notes),' ') FROM "NetworkInterface" WHERE ("assetId"=(item).id OR "networkId"=(item).id) AND NOT archived),
 (SELECT string_agg(content,' ') FROM "Comment" WHERE "recordId"=(item).id),
 (SELECT string_agg(notes,' ') FROM "ControlDeployment" WHERE ("assetId"=(item).id OR "controlId"=(item).id) AND NOT archived),
 (SELECT string_agg(concat_ws(' ',system,authentication,privileges,reviewer),' ') FROM "ProviderAccess" WHERE ("assetId"=(item).id OR "providerId"=(item).id) AND NOT archived),
 (SELECT string_agg(concat_ws(' ',name,city,country,platform,region,address),' ') FROM "ClientLocation" WHERE id=(item)."locationId")
 ))
$$;
CREATE FUNCTION mssp_record_search_trigger() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW."searchText":=mssp_build_search(NEW);RETURN NEW;END $$;
CREATE TRIGGER record_search BEFORE INSERT OR UPDATE OF title,owner,data,"assetType",kind,status,severity,"locationId" ON "Record" FOR EACH ROW EXECUTE FUNCTION mssp_record_search_trigger();
CREATE FUNCTION mssp_refresh_child_search() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE previous JSONB:='{}';current_row JSONB:='{}';target TEXT;
BEGIN
 IF TG_OP<>'INSERT' THEN previous:=to_jsonb(OLD);END IF;
 IF TG_OP<>'DELETE' THEN current_row:=to_jsonb(NEW);END IF;
 IF TG_TABLE_NAME='ClientLocation' THEN
  UPDATE "Record" r SET "searchText"=mssp_build_search(r) WHERE r."locationId" IN (previous->>'id',current_row->>'id');
 ELSE
  FOR target IN SELECT DISTINCT value FROM (SELECT * FROM jsonb_each_text(previous) UNION ALL SELECT * FROM jsonb_each_text(current_row)) fields WHERE key IN ('recordId','identityId','assetId','networkId','controlId','providerId') AND value IS NOT NULL ORDER BY value LOOP
   UPDATE "Record" r SET "searchText"=mssp_build_search(r) WHERE id=target;
  END LOOP;
 END IF;RETURN NULL;
END $$;
CREATE TRIGGER account_search AFTER INSERT OR UPDATE OR DELETE ON "Account" FOR EACH ROW EXECUTE FUNCTION mssp_refresh_child_search();
CREATE TRIGGER grant_search AFTER INSERT OR UPDATE OR DELETE ON "AccessGrant" FOR EACH ROW EXECUTE FUNCTION mssp_refresh_child_search();
CREATE TRIGGER interface_search AFTER INSERT OR UPDATE OR DELETE ON "NetworkInterface" FOR EACH ROW EXECUTE FUNCTION mssp_refresh_child_search();
CREATE TRIGGER comment_search AFTER INSERT OR UPDATE OR DELETE ON "Comment" FOR EACH ROW EXECUTE FUNCTION mssp_refresh_child_search();
CREATE TRIGGER deployment_search AFTER INSERT OR UPDATE OR DELETE ON "ControlDeployment" FOR EACH ROW EXECUTE FUNCTION mssp_refresh_child_search();
CREATE TRIGGER provider_access_search AFTER INSERT OR UPDATE OR DELETE ON "ProviderAccess" FOR EACH ROW EXECUTE FUNCTION mssp_refresh_child_search();
CREATE TRIGGER location_search AFTER UPDATE ON "ClientLocation" FOR EACH ROW EXECUTE FUNCTION mssp_refresh_child_search();
UPDATE "Record" r SET "searchText"=mssp_build_search(r);

COMMIT;
