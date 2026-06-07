# ERD — Modelo de datos (borrador) · Plataforma TAR Internacional

> Borrador de la Fase 1 (PRD §4.1). Fuente de verdad: `packages/db/src/schema.ts`.
> El **ERD definitivo en PDF** (entregable §15) se genera en el Lanzamiento.
> Dump del esquema aplicado: [`docs/schema.sql`](./schema.sql).

Diagrama (Mermaid) de las 14 tablas del dominio. PostgreSQL 16 + PostGIS 3.4
(`geo` en `geography(Point,4326)`; full-text español en `properties.search_vector`).

```mermaid
erDiagram
    users ||--o{ refresh_tokens : "tiene"
    users ||--o{ properties : "created_by"
    users ||--o{ leads : "assigned_to"
    users ||--o{ lead_events : "user_id"

    locations ||--o{ properties : "ubica"

    properties ||--o{ property_images : "tiene"
    properties ||--o{ property_amenities : "tiene"
    amenities  ||--o{ property_amenities : "clasifica"
    properties ||--o{ property_events : "registra"
    properties ||--o{ leads : "genera"

    leads ||--o{ lead_events : "bitácora"

    webhook_subscriptions ||--o{ webhook_deliveries : "entrega"

    users {
        uuid id PK
        citext email UK
        text password_hash
        text name
        enum role "admin|broker"
        bool is_active
    }
    refresh_tokens {
        uuid id PK
        uuid user_id FK
        text token_hash
        timestamptz expires_at
        timestamptz revoked_at
    }
    locations {
        uuid id PK
        text estado
        text municipio
        text colonia
        text slug_estado
        text slug_colonia
    }
    properties {
        uuid id PK
        text slug UK
        text external_ref UK
        enum property_type
        numeric price_sale
        char currency_sale
        numeric price_rent
        char currency_rent
        numeric price_sale_mxn
        numeric price_rent_mxn
        int bedrooms
        int bathrooms
        geography geo
        enum status "borrador|disponible|apartado|rentado|vendido|pausado"
        enum featured "normal|destacada|premium"
        tsvector search_vector
        timestamptz published_at
        timestamptz deleted_at
        uuid location_id FK
        uuid created_by FK
    }
    amenities {
        uuid id PK
        text name UK
        text icon
    }
    property_amenities {
        uuid property_id FK
        uuid amenity_id FK
    }
    property_images {
        uuid id PK
        uuid property_id FK
        text url_webp
        text url_thumb
        int position
        bool is_cover
    }
    leads {
        uuid id PK
        uuid property_id FK
        text name
        text email
        enum type "contacto|cita"
        timestamptz preferred_at
        enum status "nuevo|contactado|calificado|descartado|cerrado"
        uuid assigned_to FK
        timestamptz consent_at
        timestamptz deleted_at
    }
    lead_events {
        uuid id PK
        uuid lead_id FK
        text type
        jsonb payload
        uuid user_id FK
    }
    webhook_subscriptions {
        uuid id PK
        text name
        text target_url
        text secret
        text_array events
        bool is_active
    }
    webhook_deliveries {
        uuid id PK
        uuid subscription_id FK
        text event
        enum status "pendiente|entregado|fallido"
        int attempts
        int response_code
    }
    api_keys {
        uuid id PK
        text name
        text key_hash
        text_array scopes
        bool is_active
    }
    property_events {
        uuid id PK
        uuid property_id FK
        enum type "view"
        jsonb meta
    }
    marketing_scripts {
        uuid id PK
        text name
        enum placement "head|body|footer"
        text code
        bool is_active
    }
```

## Notas de diseño
- **Precios duales:** una propiedad puede ofrecerse en venta, renta o ambas. El
  display usa la moneda original; los filtros/orden usan `price_*_mxn` (normalizado
  con `USD_MXN_RATE`).
- **Soft delete:** `properties.deleted_at` y `leads.deleted_at` (nunca hard delete).
- **Índices:** btree compuestos para filtros escalares, GIN full-text sobre
  `search_vector`, GiST sobre `geo`, únicos sobre `slug` y `external_ref`.
- `api_keys` y `marketing_scripts` no tienen FKs (catálogos independientes).
