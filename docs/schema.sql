--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg110+2)
-- Dumped by pg_dump version 16.4 (Debian 16.4-1.pgdg110+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: delivery_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.delivery_status AS ENUM (
    'pendiente',
    'entregado',
    'fallido'
);


--
-- Name: featured_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.featured_level AS ENUM (
    'normal',
    'destacada',
    'premium'
);


--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_status AS ENUM (
    'nuevo',
    'contactado',
    'calificado',
    'descartado',
    'cerrado'
);


--
-- Name: lead_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_type AS ENUM (
    'contacto',
    'cita'
);


--
-- Name: property_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.property_event_type AS ENUM (
    'view'
);


--
-- Name: property_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.property_status AS ENUM (
    'borrador',
    'disponible',
    'apartado',
    'rentado',
    'vendido',
    'pausado'
);


--
-- Name: property_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.property_type AS ENUM (
    'casa',
    'departamento',
    'oficina',
    'local_comercial',
    'bodega_industrial',
    'terreno_industrial',
    'edificio',
    'terreno'
);


--
-- Name: script_placement; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.script_placement AS ENUM (
    'head',
    'body',
    'footer'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'broker'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: amenities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.amenities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon text
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    key_hash text NOT NULL,
    scopes text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    type text NOT NULL,
    payload jsonb,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    message text,
    type public.lead_type DEFAULT 'contacto'::public.lead_type NOT NULL,
    preferred_at timestamp with time zone,
    source text,
    utm jsonb,
    status public.lead_status DEFAULT 'nuevo'::public.lead_status NOT NULL,
    assigned_to uuid,
    consent_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    estado text NOT NULL,
    municipio text NOT NULL,
    colonia text NOT NULL,
    slug_estado text NOT NULL,
    slug_colonia text NOT NULL
);


--
-- Name: marketing_scripts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketing_scripts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    placement public.script_placement NOT NULL,
    code text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text,
    external_ref text,
    title text NOT NULL,
    description text,
    property_type public.property_type NOT NULL,
    price_sale numeric(14,2),
    currency_sale character(3),
    price_rent numeric(14,2),
    currency_rent character(3),
    price_sale_mxn numeric(14,2),
    price_rent_mxn numeric(14,2),
    bedrooms integer,
    bathrooms integer,
    half_bathrooms integer,
    parking integer,
    floor text,
    area_m2 numeric(10,2),
    lot_m2 numeric(10,2),
    location_id uuid,
    address text,
    postal_code text,
    geo public.geography(Point,4326),
    status public.property_status DEFAULT 'borrador'::public.property_status NOT NULL,
    featured public.featured_level DEFAULT 'normal'::public.featured_level NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('spanish'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(description, ''::text)))) STORED,
    published_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: property_amenities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_amenities (
    property_id uuid NOT NULL,
    amenity_id uuid NOT NULL
);


--
-- Name: property_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    type public.property_event_type NOT NULL,
    meta jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: property_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    url_webp text NOT NULL,
    url_thumb text NOT NULL,
    alt text,
    "position" integer DEFAULT 0 NOT NULL,
    width integer,
    height integer,
    is_cover boolean DEFAULT false NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    role public.user_role DEFAULT 'broker'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: webhook_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid NOT NULL,
    event text NOT NULL,
    payload jsonb,
    status public.delivery_status DEFAULT 'pendiente'::public.delivery_status NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    response_code integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    delivered_at timestamp with time zone
);


--
-- Name: webhook_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    target_url text NOT NULL,
    secret text NOT NULL,
    events text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: amenities amenities_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_name_unique UNIQUE (name);


--
-- Name: amenities amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: lead_events lead_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_events
    ADD CONSTRAINT lead_events_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: marketing_scripts marketing_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_scripts
    ADD CONSTRAINT marketing_scripts_pkey PRIMARY KEY (id);


--
-- Name: properties properties_external_ref_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_external_ref_unique UNIQUE (external_ref);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: properties properties_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_slug_unique UNIQUE (slug);


--
-- Name: property_amenities property_amenities_property_id_amenity_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_amenities
    ADD CONSTRAINT property_amenities_property_id_amenity_id_pk PRIMARY KEY (property_id, amenity_id);


--
-- Name: property_events property_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_events
    ADD CONSTRAINT property_events_pkey PRIMARY KEY (id);


--
-- Name: property_images property_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webhook_deliveries webhook_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);


--
-- Name: webhook_subscriptions webhook_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_subscriptions
    ADD CONSTRAINT webhook_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: lead_events_lead_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_events_lead_idx ON public.lead_events USING btree (lead_id);


--
-- Name: leads_assigned_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_assigned_idx ON public.leads USING btree (assigned_to);


--
-- Name: leads_property_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_property_idx ON public.leads USING btree (property_id);


--
-- Name: leads_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_status_idx ON public.leads USING btree (status);


--
-- Name: locations_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_slug_idx ON public.locations USING btree (slug_estado, slug_colonia);


--
-- Name: locations_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX locations_unique_idx ON public.locations USING btree (estado, municipio, colonia);


--
-- Name: properties_bedrooms_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_bedrooms_idx ON public.properties USING btree (bedrooms);


--
-- Name: properties_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_featured_idx ON public.properties USING btree (featured, published_at);


--
-- Name: properties_geo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_geo_idx ON public.properties USING gist (geo);


--
-- Name: properties_rent_filter_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_rent_filter_idx ON public.properties USING btree (status, property_type, price_rent_mxn);


--
-- Name: properties_sale_filter_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_sale_filter_idx ON public.properties USING btree (status, property_type, price_sale_mxn);


--
-- Name: properties_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_search_idx ON public.properties USING gin (search_vector);


--
-- Name: property_amenities_amenity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX property_amenities_amenity_idx ON public.property_amenities USING btree (amenity_id);


--
-- Name: property_events_prop_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX property_events_prop_idx ON public.property_events USING btree (property_id, type, created_at);


--
-- Name: property_images_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX property_images_position_idx ON public.property_images USING btree (property_id, "position");


--
-- Name: refresh_tokens_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_user_idx ON public.refresh_tokens USING btree (user_id);


--
-- Name: webhook_deliveries_subscription_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_deliveries_subscription_idx ON public.webhook_deliveries USING btree (subscription_id);


--
-- Name: lead_events lead_events_lead_id_leads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_events
    ADD CONSTRAINT lead_events_lead_id_leads_id_fk FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_events lead_events_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_events
    ADD CONSTRAINT lead_events_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: leads leads_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: leads leads_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: properties properties_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: properties properties_location_id_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: property_amenities property_amenities_amenity_id_amenities_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_amenities
    ADD CONSTRAINT property_amenities_amenity_id_amenities_id_fk FOREIGN KEY (amenity_id) REFERENCES public.amenities(id) ON DELETE CASCADE;


--
-- Name: property_amenities property_amenities_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_amenities
    ADD CONSTRAINT property_amenities_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: property_events property_events_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_events
    ADD CONSTRAINT property_events_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: property_images property_images_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: webhook_deliveries webhook_deliveries_subscription_id_webhook_subscriptions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_subscription_id_webhook_subscriptions_id_fk FOREIGN KEY (subscription_id) REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

