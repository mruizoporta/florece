--
-- PostgreSQL database dump
--

\restrict LdREIlXb65YAWDvsHxw8r6udJ0OmapOutbTrJxtTbt0f5dgeoWwao9xNiyZEYyR

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointment_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_services (
    id bigint NOT NULL,
    appointment_id bigint NOT NULL,
    service_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: appointment_services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appointment_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appointment_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appointment_services_id_seq OWNED BY public.appointment_services.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id bigint NOT NULL,
    customer_id bigint NOT NULL,
    employee_id bigint,
    status_id bigint NOT NULL,
    type_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(255),
    start_time timestamp(0) without time zone,
    end_time timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appointments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: employee_social; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_social (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    social_id bigint NOT NULL,
    href character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: employee_social_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_social_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_social_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_social_id_seq OWNED BY public.employee_social.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    image character varying(255) NOT NULL,
    status boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    positions_id bigint,
    commission_rate numeric(5,2),
    base_salary numeric(10,2),
    tenant_id bigint DEFAULT '1'::bigint NOT NULL,
    visible_public boolean DEFAULT true NOT NULL
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.images (
    id bigint NOT NULL,
    product_id bigint NOT NULL,
    image character varying(255) NOT NULL,
    "order" integer NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.images_id_seq OWNED BY public.images.id;


--
-- Name: instagram_feeds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instagram_feeds (
    id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: instagram_feeds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.instagram_feeds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: instagram_feeds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.instagram_feeds_id_seq OWNED BY public.instagram_feeds.id;


--
-- Name: item_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_order (
    id bigint NOT NULL,
    item_id bigint NOT NULL,
    order_id bigint NOT NULL,
    price numeric(8,2) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL,
    product_id bigint,
    product_name_snapshot character varying(255),
    unit_price_snapshot numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    line_discount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    line_tax numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    line_total numeric(10,2) DEFAULT '0'::numeric NOT NULL
);


--
-- Name: item_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_order_id_seq OWNED BY public.item_order.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id bigint NOT NULL,
    category_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    price numeric(8,2) NOT NULL,
    image character varying(255),
    status boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: model_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_permissions (
    permission_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


--
-- Name: model_has_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_roles (
    role_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


--
-- Name: order_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_payments (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    order_id bigint NOT NULL,
    method character varying(20) NOT NULL,
    amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    reference character varying(255),
    paid_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: order_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_payments_id_seq OWNED BY public.order_payments.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    customer_id bigint,
    payment_status boolean DEFAULT false NOT NULL,
    name character varying(255) NOT NULL,
    subtotal numeric(8,2) DEFAULT '0'::numeric NOT NULL,
    discount numeric(8,2) DEFAULT '0'::numeric NOT NULL,
    total numeric(8,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL,
    employee_id bigint,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    discount_total numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    tax_total numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    finalized_at timestamp(0) without time zone,
    cancelled_at timestamp(0) without time zone,
    cancelled_reason character varying(255)
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: personal_information; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_information (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    document character varying(255),
    location character varying(255),
    address character varying(255),
    phone character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: personal_information_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_information_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_information_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_information_id_seq OWNED BY public.personal_information.id;


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    "interval" character varying(255) DEFAULT 'month'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    stripe_price_id_ni character varying(255),
    stripe_price_id_us character varying(255),
    max_employees integer,
    max_services integer,
    price_us_monthly numeric(10,2),
    price_ni_monthly numeric(10,2),
    currency_us character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    currency_ni character varying(3) DEFAULT 'USD'::character varying NOT NULL
);


--
-- Name: COLUMN plans."interval"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.plans."interval" IS 'month, year';


--
-- Name: COLUMN plans.stripe_price_id_ni; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.plans.stripe_price_id_ni IS 'Price ID para Nicaragua';


--
-- Name: COLUMN plans.stripe_price_id_us; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.plans.stripe_price_id_us IS 'Price ID para Estados Unidos';


--
-- Name: COLUMN plans.max_employees; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.plans.max_employees IS 'null = ilimitado';


--
-- Name: COLUMN plans.max_services; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.plans.max_services IS 'null = ilimitado';


--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.positions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: positions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.positions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.positions_id_seq OWNED BY public.positions.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id bigint NOT NULL,
    item_id bigint NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    stock_alert integer DEFAULT 5 NOT NULL,
    long_description text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(255),
    contact_person character varying(255),
    address character varying(255),
    city character varying(255),
    country character varying(255),
    website character varying(255),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.providers_id_seq OWNED BY public.providers.id;


--
-- Name: role_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_has_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedules (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    weekday character varying(255) NOT NULL,
    start_time time(0) without time zone NOT NULL,
    end_time time(0) without time zone NOT NULL,
    status boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL,
    CONSTRAINT schedules_weekday_check CHECK (((weekday)::text = ANY ((ARRAY['1'::character varying, '2'::character varying, '3'::character varying, '4'::character varying, '5'::character varying, '6'::character varying, '7'::character varying])::text[])))
);


--
-- Name: schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedules_id_seq OWNED BY public.schedules.id;


--
-- Name: sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sections (
    id bigint NOT NULL,
    about_us_show_section boolean DEFAULT true NOT NULL,
    about_us_text character varying(25) DEFAULT 'Sobre nosotros'::character varying NOT NULL,
    about_us_icon character varying(75) DEFAULT 'icon-line-scissors fs-1'::character varying NOT NULL,
    employees_show_section boolean DEFAULT true NOT NULL,
    employees_text character varying(25) DEFAULT 'Nuestro equipo'::character varying NOT NULL,
    employees_icon character varying(75) DEFAULT 'icon-users fs-1'::character varying NOT NULL,
    services_show_section boolean DEFAULT true NOT NULL,
    services_text character varying(25) DEFAULT 'Nuestros servicios'::character varying NOT NULL,
    services_icon character varying(75) DEFAULT 'icon-sticky-note1 fs-1'::character varying NOT NULL,
    products_show_section boolean DEFAULT true NOT NULL,
    products_text character varying(25) DEFAULT 'Productos'::character varying NOT NULL,
    products_icon character varying(75) DEFAULT 'icon-tags fs-1'::character varying NOT NULL,
    instagram_show_section boolean DEFAULT true NOT NULL,
    instagram_text character varying(25) DEFAULT 'SEGUINOS EN INSTAGRAM'::character varying NOT NULL,
    instagram_icon character varying(75) DEFAULT 'icon-instagram'::character varying NOT NULL,
    whatsapp_show_section boolean DEFAULT true NOT NULL,
    whatsapp_title_1 character varying(75) DEFAULT '¿TIENES ALGUNA DUDA?'::character varying NOT NULL,
    whatsapp_title_2 character varying(75) DEFAULT 'No dudes en consultar!'::character varying NOT NULL,
    whatsapp_title_3 character varying(75) DEFAULT 'Al recibir tu mensaje responderemos a la brevedad.'::character varying NOT NULL,
    whatsapp_icon character varying(75) DEFAULT 'icon-whatsapp'::character varying NOT NULL,
    btn_whatsapp_button_text character varying(25) DEFAULT 'Abrir chat'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sections_id_seq OWNED BY public.sections.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id bigint NOT NULL,
    item_id bigint NOT NULL,
    duration_time integer DEFAULT 30 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id bigint NOT NULL,
    active_appointment boolean DEFAULT true NOT NULL,
    appointment_type character varying(255) DEFAULT 'blacklist'::character varying NOT NULL,
    company_name character varying(255),
    mail_contact character varying(255),
    location character varying(255),
    address character varying(255),
    phone character varying(255),
    currency_symbol character varying(255) DEFAULT '$'::character varying NOT NULL,
    whatsapp character varying(255),
    instagram_href character varying(255),
    embedded_content_map text,
    logo character varying(255) DEFAULT 'your-logo.png'::character varying NOT NULL,
    banner character varying(255) DEFAULT 'your-banner.jpg'::character varying NOT NULL,
    about_us character varying(255),
    schedules character varying(255),
    image_left character varying(255) DEFAULT 'image_left.jpg'::character varying NOT NULL,
    image_right character varying(255) DEFAULT 'image_right.jpg'::character varying NOT NULL,
    image_parallax character varying(255) DEFAULT 'image_parallax.jpg'::character varying NOT NULL,
    buttons_background_color character varying(15) DEFAULT 'ff8585'::character varying NOT NULL,
    buttons_text_color character varying(15) DEFAULT 'ffffff'::character varying NOT NULL,
    icons_color character varying(15) DEFAULT 'ff8585'::character varying NOT NULL,
    titles_color character varying(15) DEFAULT 'ff8585'::character varying NOT NULL,
    footer_background_color character varying(15) DEFAULT '283747'::character varying NOT NULL,
    footer_text_color character varying(15) DEFAULT 'ffffff'::character varying NOT NULL,
    btn_whatsapp_background_color character varying(15) DEFAULT '128c7e'::character varying NOT NULL,
    btn_whatsapp_text_color character varying(15) DEFAULT 'ffffff'::character varying NOT NULL,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL,
    CONSTRAINT settings_appointment_type_check CHECK (((appointment_type)::text = ANY ((ARRAY['blacklist'::character varying, 'whitelist'::character varying])::text[])))
);


--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: socials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.socials (
    id bigint NOT NULL,
    name character varying(75) NOT NULL,
    icon character varying(75) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: socials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.socials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: socials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.socials_id_seq OWNED BY public.socials.id;


--
-- Name: sponsors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sponsors (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    image character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: sponsors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sponsors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sponsors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sponsors_id_seq OWNED BY public.sponsors.id;


--
-- Name: status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    bg_color character varying(255) NOT NULL,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.status_id_seq OWNED BY public.status.id;


--
-- Name: subscription_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_items (
    id bigint NOT NULL,
    subscription_id bigint NOT NULL,
    stripe_id character varying(255) NOT NULL,
    stripe_product character varying(255) NOT NULL,
    stripe_price character varying(255) NOT NULL,
    quantity integer,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    meter_id character varying(255),
    meter_event_name character varying(255)
);


--
-- Name: subscription_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscription_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscription_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscription_items_id_seq OWNED BY public.subscription_items.id;


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    type character varying(255) NOT NULL,
    stripe_id character varying(255) NOT NULL,
    stripe_status character varying(255) NOT NULL,
    stripe_price character varying(255),
    quantity integer,
    trial_ends_at timestamp(0) without time zone,
    ends_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    billing_region character varying(2),
    locale character varying(10) DEFAULT 'es'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    stripe_id character varying(255),
    pm_type character varying(255),
    pm_last_four character varying(4),
    trial_ends_at timestamp(0) without time zone,
    billing_email character varying(255),
    plan_id bigint,
    subscription_status character varying(20) DEFAULT 'trial'::character varying NOT NULL,
    subscription_ends_at timestamp(0) without time zone,
    scheduled_plan_id bigint,
    past_due_since timestamp(0) without time zone,
    is_demo boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN tenants.billing_region; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.billing_region IS 'NI, US, etc.';


--
-- Name: COLUMN tenants.subscription_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.subscription_status IS 'active, trial, past_due, canceled, expired';


--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenants_id_seq OWNED BY public.tenants.id;


--
-- Name: types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.types (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    bg_color character varying(255) NOT NULL,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.types_id_seq OWNED BY public.types.id;


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    abbreviation character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    image character varying(255) DEFAULT 'default.png'::character varying NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    tenant_id bigint DEFAULT '1'::bigint NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: appointment_services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_services ALTER COLUMN id SET DEFAULT nextval('public.appointment_services_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: employee_social id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_social ALTER COLUMN id SET DEFAULT nextval('public.employee_social_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images ALTER COLUMN id SET DEFAULT nextval('public.images_id_seq'::regclass);


--
-- Name: instagram_feeds id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_feeds ALTER COLUMN id SET DEFAULT nextval('public.instagram_feeds_id_seq'::regclass);


--
-- Name: item_order id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_order ALTER COLUMN id SET DEFAULT nextval('public.item_order_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: order_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_payments ALTER COLUMN id SET DEFAULT nextval('public.order_payments_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: personal_information id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_information ALTER COLUMN id SET DEFAULT nextval('public.personal_information_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: positions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions ALTER COLUMN id SET DEFAULT nextval('public.positions_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: providers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers ALTER COLUMN id SET DEFAULT nextval('public.providers_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules ALTER COLUMN id SET DEFAULT nextval('public.schedules_id_seq'::regclass);


--
-- Name: sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections ALTER COLUMN id SET DEFAULT nextval('public.sections_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: socials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socials ALTER COLUMN id SET DEFAULT nextval('public.socials_id_seq'::regclass);


--
-- Name: sponsors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsors ALTER COLUMN id SET DEFAULT nextval('public.sponsors_id_seq'::regclass);


--
-- Name: status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status ALTER COLUMN id SET DEFAULT nextval('public.status_id_seq'::regclass);


--
-- Name: subscription_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_items ALTER COLUMN id SET DEFAULT nextval('public.subscription_items_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants ALTER COLUMN id SET DEFAULT nextval('public.tenants_id_seq'::regclass);


--
-- Name: types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types ALTER COLUMN id SET DEFAULT nextval('public.types_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: appointment_services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointment_services (id, appointment_id, service_id, created_at, updated_at, tenant_id) FROM stdin;
1	1	17	2026-03-21 22:24:35	2026-03-21 22:24:35	3
2	2	17	2026-03-21 22:24:36	2026-03-21 22:24:36	3
3	3	17	2026-03-21 22:24:36	2026-03-21 22:24:36	3
4	4	17	2026-03-21 22:24:37	2026-03-21 22:24:37	3
5	5	17	2026-03-21 22:24:38	2026-03-21 22:24:38	3
6	6	17	2026-03-21 22:24:39	2026-03-21 22:24:39	3
7	7	17	2026-03-21 22:24:40	2026-03-21 22:24:40	3
8	8	17	2026-03-21 22:24:40	2026-03-21 22:24:40	3
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (id, customer_id, employee_id, status_id, type_id, name, phone, start_time, end_time, created_at, updated_at, tenant_id) FROM stdin;
1	3	5	15	8	Cliente Demo	\N	2026-03-19 10:00:35	2026-03-19 10:45:35	2026-03-21 22:24:35	2026-03-21 22:24:35	3
2	3	6	15	8	Cliente Demo	\N	2026-03-19 10:00:35	2026-03-19 10:45:35	2026-03-21 22:24:35	2026-03-21 22:24:35	3
3	3	5	15	8	Cliente Demo	\N	2026-03-20 10:00:36	2026-03-20 10:45:36	2026-03-21 22:24:36	2026-03-21 22:24:36	3
4	3	6	15	8	Cliente Demo	\N	2026-03-20 10:00:36	2026-03-20 10:45:36	2026-03-21 22:24:37	2026-03-21 22:24:37	3
5	3	5	12	8	Cliente Demo	\N	2026-03-21 10:00:38	2026-03-21 10:45:38	2026-03-21 22:24:38	2026-03-21 22:24:38	3
6	3	6	12	8	Cliente Demo	\N	2026-03-21 10:00:38	2026-03-21 10:45:38	2026-03-21 22:24:38	2026-03-21 22:24:38	3
7	3	5	12	8	Cliente Demo	\N	2026-03-22 10:00:39	2026-03-22 10:45:39	2026-03-21 22:24:39	2026-03-21 22:24:39	3
8	3	6	12	8	Cliente Demo	\N	2026-03-22 10:00:39	2026-03-22 10:45:39	2026-03-21 22:24:40	2026-03-21 22:24:40	3
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, slug, created_at, updated_at, deleted_at, tenant_id) FROM stdin;
1	Cortes	cortes	2026-03-21 20:16:45	2026-03-21 20:16:45	\N	1
2	Peinados	peinados	2026-03-21 20:16:45	2026-03-21 20:16:45	\N	1
3	Color	color	2026-03-21 20:16:46	2026-03-21 20:16:46	\N	1
4	Tratamientos	tratamientos	2026-03-21 20:16:46	2026-03-21 20:16:46	\N	1
9	Cortes	cortes	2026-03-21 22:24:11	2026-03-21 22:24:11	\N	3
10	Peinados	peinados	2026-03-21 22:24:11	2026-03-21 22:24:11	\N	3
11	Color	color	2026-03-21 22:24:11	2026-03-21 22:24:11	\N	3
12	Tratamientos	tratamientos	2026-03-21 22:24:11	2026-03-21 22:24:11	\N	3
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, user_id, created_at, updated_at, tenant_id) FROM stdin;
1	1	2026-03-21 20:17:10	2026-03-21 20:17:10	1
3	7	2026-03-21 22:24:19	2026-03-21 22:24:19	3
4	3	2026-03-23 01:38:02	2026-03-23 01:38:02	1
\.


--
-- Data for Name: employee_social; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_social (id, employee_id, social_id, href, created_at, updated_at, tenant_id) FROM stdin;
1	1	1	instagram.com/@juan	2026-03-21 20:17:12	2026-03-21 20:17:12	1
2	1	2	linkedin.com/in/@juan	2026-03-21 20:17:13	2026-03-21 20:17:13	1
3	2	1	instagram.com/@eduard	2026-03-21 20:17:13	2026-03-21 20:17:13	1
4	2	2	linkedin.com/in/@eduard	2026-03-21 20:17:13	2026-03-21 20:17:13	1
5	3	1	instagram.com/@anna	2026-03-21 20:17:14	2026-03-21 20:17:14	1
6	3	2	linkedin.com/in/@anna	2026-03-21 20:17:14	2026-03-21 20:17:14	1
7	4	1	instagram.com/@carl	2026-03-21 20:17:15	2026-03-21 20:17:15	1
8	4	2	linkedin.com/in/@carl	2026-03-21 20:17:15	2026-03-21 20:17:15	1
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, name, description, image, status, created_at, updated_at, positions_id, commission_rate, base_salary, tenant_id, visible_public) FROM stdin;
1	Juan	Barbero	juan-avatar.jpg	t	2026-03-21 20:17:11	2026-03-21 20:17:11	\N	\N	\N	1	t
2	Eduard	Barbero	eduard-avatar.jpg	t	2026-03-21 20:17:11	2026-03-21 20:17:11	\N	\N	\N	1	t
3	Anna	Peinados & Cortes & Uñas	anna-avatar.jpg	t	2026-03-21 20:17:11	2026-03-21 20:17:11	\N	\N	\N	1	t
4	Carl	Barbero	carl-avatar.jpg	t	2026-03-21 20:17:12	2026-03-21 20:17:12	\N	\N	\N	1	t
5	María	Estilista	placeholder.webp	t	2026-03-21 22:24:26	2026-03-21 22:24:26	\N	\N	\N	3	t
6	Carlos	Barbero	placeholder.webp	t	2026-03-21 22:24:29	2026-03-21 22:24:29	\N	\N	\N	3	t
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.images (id, product_id, image, "order", created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: instagram_feeds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.instagram_feeds (id, content, created_at, updated_at, deleted_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: item_order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_order (id, item_id, order_id, price, quantity, created_at, updated_at, deleted_at, tenant_id, product_id, product_name_snapshot, unit_price_snapshot, line_discount, line_tax, line_total) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, category_id, name, slug, description, price, image, status, created_at, updated_at, tenant_id) FROM stdin;
1	1	Corte para caballeros	corte-para-caballeros	Cortes personalizados para hombres, desde estilos clásicos hasta tendencias modernas	250.00	hair-cut-man.webp	t	2026-03-21 20:16:51	2026-03-21 20:16:51	1
2	1	Corte para damas	corte-para-damas	Transforma tu look con cortes diseñados para resaltar tu belleza única	300.00	hair-cut-woman.webp	t	2026-03-21 20:16:51	2026-03-21 20:16:51	1
3	1	Corte para niños	corte-para-niños	Cortes para los más pequeños	200.00	hair-cut-boys.webp	t	2026-03-21 20:16:52	2026-03-21 20:16:52	1
4	1	Corte de barba	corte-de-barba	Para los hombres que desean un cuidado especial para su barba, ofrecemos cortes y arreglos de barba precisos	300.00	beard-trimming.webp	t	2026-03-21 20:16:52	2026-03-21 20:16:52	1
5	2	Peinado especial	peinado-especial	¿Tienes un evento especial? Permítenos crear un peinado que complemente tu atuendo y realce tu belleza	450.00	hair-treatment.webp	t	2026-03-21 20:16:52	2026-03-21 20:16:52	1
6	2	Laciado	laciado	Alisado profesional para un cabello suave y liso	450.00	hair-straightener.webp	t	2026-03-21 20:16:53	2026-03-21 20:16:53	1
7	3	Tinta	tinta	Renueva tu color con opciones personalizadas	400.00	hair-dye.webp	t	2026-03-21 20:16:53	2026-03-21 20:16:53	1
8	3	Colores fantasía	colores-fantasía	Expresa tu creatividad con colores fantásticos. Desde tonos vibrantes hasta reflejos llamativos	600.00	hair-color-sample.webp	t	2026-03-21 20:16:53	2026-03-21 20:16:53	1
9	4	Maquillaje	maquillaje	Realza tu belleza natural con nuestro servicio de maquillaje personalizado	300.00	make-up.webp	t	2026-03-21 20:16:54	2026-03-21 20:16:54	1
10	4	Baño de crema	baño-de-crema	Tratamientos revitalizantes para un cabello saludable	800.00	shampoo.webp	t	2026-03-21 20:16:54	2026-03-21 20:16:54	1
11	4	Extensiones	extensiones	Añade longitud y volumen con extensiones personalizadas que se integren a tu color	750.00	hair-extension.webp	t	2026-03-21 20:16:55	2026-03-21 20:16:55	1
12	4	Uñas	uñas	Manicuras y pedicuras para embellecer tus uñas	700.00	nail.webp	t	2026-03-21 20:16:55	2026-03-21 20:16:55	1
19	9	Corte caballeros	corte-caballeros-MwcL	Servicio de demostración.	250.00	placeholder.webp	t	2026-03-21 22:24:20	2026-03-21 22:24:20	3
20	9	Corte damas	corte-damas-ifmW	Servicio de demostración.	300.00	placeholder.webp	t	2026-03-21 22:24:21	2026-03-21 22:24:21	3
21	10	Peinado especial	peinado-especial-P3iB	Servicio de demostración.	450.00	placeholder.webp	t	2026-03-21 22:24:22	2026-03-21 22:24:22	3
22	11	Tinta	tinta-RUX6	Servicio de demostración.	400.00	placeholder.webp	t	2026-03-21 22:24:23	2026-03-21 22:24:23	3
23	12	Shampoo profesional	shampoo-pro-PI74	Producto de demostración.	350.00	placeholder.webp	t	2026-03-21 22:24:24	2026-03-21 22:24:24	3
24	12	Crema capilar	crema-capilar-l0aa	Producto de demostración.	280.00	placeholder.webp	t	2026-03-21 22:24:24	2026-03-21 22:24:24	3
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	2014_10_12_000000_create_users_table	1
2	2014_10_12_100000_create_password_reset_tokens_table	1
3	2019_08_19_000000_create_failed_jobs_table	1
4	2019_12_14_000001_create_personal_access_tokens_table	1
5	2023_10_31_213100_create_employees_table	1
6	2023_10_31_213200_create_customers_table	1
7	2023_10_31_213914_create_permission_tables	1
8	2023_10_31_220935_create_settings_table	1
9	2023_11_01_144304_create_categories_table	1
10	2023_11_01_144500_create_status_table	1
11	2023_11_01_144600_create_types_table	1
12	2023_11_02_142256_create_socials_table	1
13	2023_11_02_142537_create_employee_social_table	1
14	2023_11_02_142700_create_items_table	1
15	2023_11_02_143445_create_products_table	1
16	2023_11_02_143700_create_services_table	1
17	2023_11_03_233141_create_images_table	1
18	2023_11_09_220440_create_instagram_feeds_table	1
19	2023_11_11_142555_create_personal_information_table	1
20	2023_11_12_194939_create_schedules_table	1
21	2023_11_15_004603_create_appointments_table	1
22	2023_11_15_005009_create_appointment_services_table	1
23	2023_11_24_212644_create_sponsors_table	1
24	2023_11_29_002308_create_orders_table	1
25	2023_11_29_002747_create_item_order_table	1
26	2024_01_14_151154_create_sections_table	1
27	2024_10_13_205752_create_positions_table	1
28	2024_10_13_205922_add_positions_id_comision_salario_base_to_employees_table	1
29	2024_10_13_212431_create_providers_table	1
30	2024_10_13_212813_create_units_table	1
31	2025_03_21_120000_create_tenants_table	1
32	2025_03_21_120001_add_tenant_id_to_salon_tables	1
33	2025_03_21_130000_adjust_unique_indexes_for_multi_tenant	1
34	2025_03_21_150000_add_cashier_columns_to_tenants_table	2
35	2025_03_21_155000_create_subscriptions_table	2
36	2025_03_21_155001_create_subscription_items_table	2
37	2025_03_21_160000_create_plans_table	2
38	2025_03_21_165000_add_regional_prices_to_plans_table	2
39	2025_03_21_170000_add_subscription_fields_to_tenants_table	2
40	2025_03_21_180000_add_limits_to_plans_table	2
41	2025_03_21_185000_add_scheduled_plan_to_tenants	2
42	2025_03_21_190000_add_past_due_since_to_tenants	2
43	2025_06_06_000004_add_meter_id_to_subscription_items_table	2
44	2025_06_06_000005_add_meter_event_name_to_subscription_items_table	2
45	2026_03_21_100000_add_is_demo_to_tenants_table	3
46	2026_03_23_120000_add_display_prices_to_plans_table	4
47	2026_03_21_200000_add_visible_public_to_employees_table	5
48	2026_03_21_210000_upgrade_orders_for_pos_architecture	5
49	2026_03_25_000001_add_performance_indexes	5
\.


--
-- Data for Name: model_has_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.model_has_permissions (permission_id, model_type, model_id) FROM stdin;
\.


--
-- Data for Name: model_has_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.model_has_roles (role_id, model_type, model_id) FROM stdin;
3	App\\Models\\User	1
1	App\\Models\\User	2
2	App\\Models\\User	3
1	App\\Models\\User	6
2	App\\Models\\User	7
\.


--
-- Data for Name: order_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_payments (id, tenant_id, order_id, method, amount, reference, paid_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, customer_id, payment_status, name, subtotal, discount, total, created_at, updated_at, deleted_at, tenant_id, employee_id, status, discount_total, tax_total, finalized_at, cancelled_at, cancelled_reason) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, guard_name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: personal_information; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personal_information (id, employee_id, document, location, address, phone, created_at, updated_at, tenant_id) FROM stdin;
1	1	346687412	Centro, Montevideo	Street J. 1234	59812345678	2026-03-21 20:17:15	2026-03-21 20:17:15	1
2	2	53022574	Centro, Montevideo	Street E. 1234	59811222333	2026-03-21 20:17:16	2026-03-21 20:17:16	1
3	3	44810021	Centro, Montevideo	Street Z. 1337	5980011222	2026-03-21 20:17:16	2026-03-21 20:17:16	1
4	4	53574123	Centro, Montevideo	Street C. 1234	59833444555	2026-03-21 20:17:17	2026-03-21 20:17:17	1
5	5	00000000	Managua	Calle Demo 123	88881234	2026-03-21 22:24:26	2026-03-21 22:24:26	3
6	6	00000000	Managua	Calle Demo 123	88881234	2026-03-21 22:24:29	2026-03-21 22:24:29	3
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plans (id, name, slug, "interval", created_at, updated_at, stripe_price_id_ni, stripe_price_id_us, max_employees, max_services, price_us_monthly, price_ni_monthly, currency_us, currency_ni) FROM stdin;
1	Básico	basico	month	2026-03-23 00:49:32	2026-03-23 01:54:16	price_xxx	price_xxx	3	10	19.00	9.00	USD	USD
2	Pro	pro	month	2026-03-23 00:49:33	2026-03-23 01:54:17	price_xxx	price_xxx	\N	\N	39.00	19.00	USD	USD
3	Premium	premium	month	2026-03-23 00:49:34	2026-03-23 01:54:17	price_xxx	price_xxx	\N	\N	69.00	29.00	USD	USD
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.positions (id, name, slug, active, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, item_id, stock, stock_alert, long_description, created_at, updated_at, tenant_id) FROM stdin;
3	23	50	10	<p>Producto demo.</p>	2026-03-21 22:24:24	2026-03-21 22:24:24	3
4	24	50	10	<p>Producto demo.</p>	2026-03-21 22:24:25	2026-03-21 22:24:25	3
\.


--
-- Data for Name: providers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.providers (id, name, email, phone, contact_person, address, city, country, website, active, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: role_has_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_has_permissions (permission_id, role_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, guard_name, created_at, updated_at) FROM stdin;
1	Admin	web	2026-03-21 20:16:46	2026-03-21 20:16:46
2	Customer	web	2026-03-21 20:16:47	2026-03-21 20:16:47
3	Final consumer	web	2026-03-21 20:16:48	2026-03-21 20:16:48
\.


--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.schedules (id, employee_id, weekday, start_time, end_time, status, created_at, updated_at, tenant_id) FROM stdin;
1	1	1	09:00:00	16:00:00	t	2026-03-21 20:17:17	2026-03-21 20:17:17	1
2	1	2	09:00:00	16:00:00	t	2026-03-21 20:17:17	2026-03-21 20:17:17	1
3	1	3	09:00:00	16:00:00	t	2026-03-21 20:17:18	2026-03-21 20:17:18	1
4	1	4	09:00:00	16:00:00	t	2026-03-21 20:17:18	2026-03-21 20:17:18	1
5	1	5	09:00:00	16:00:00	t	2026-03-21 20:17:19	2026-03-21 20:17:19	1
6	1	6	09:00:00	13:00:00	t	2026-03-21 20:17:19	2026-03-21 20:17:19	1
7	1	7	09:00:00	13:00:00	f	2026-03-21 20:17:19	2026-03-21 20:17:19	1
8	2	1	09:00:00	16:00:00	t	2026-03-21 20:17:20	2026-03-21 20:17:20	1
9	2	2	09:00:00	16:00:00	t	2026-03-21 20:17:20	2026-03-21 20:17:20	1
10	2	3	09:00:00	16:00:00	t	2026-03-21 20:17:21	2026-03-21 20:17:21	1
11	2	4	09:00:00	16:00:00	t	2026-03-21 20:17:21	2026-03-21 20:17:21	1
12	2	5	09:00:00	16:00:00	t	2026-03-21 20:17:21	2026-03-21 20:17:21	1
13	2	6	09:00:00	13:00:00	t	2026-03-21 20:17:22	2026-03-21 20:17:22	1
14	2	7	09:00:00	13:00:00	f	2026-03-21 20:17:22	2026-03-21 20:17:22	1
15	3	1	09:00:00	16:00:00	t	2026-03-21 20:17:22	2026-03-21 20:17:22	1
16	3	2	09:00:00	16:00:00	t	2026-03-21 20:17:23	2026-03-21 20:17:23	1
17	3	3	09:00:00	16:00:00	t	2026-03-21 20:17:23	2026-03-21 20:17:23	1
18	3	4	09:00:00	16:00:00	t	2026-03-21 20:17:24	2026-03-21 20:17:24	1
19	3	5	09:00:00	16:00:00	t	2026-03-21 20:17:24	2026-03-21 20:17:24	1
20	3	6	09:00:00	13:00:00	t	2026-03-21 20:17:24	2026-03-21 20:17:24	1
21	3	7	09:00:00	13:00:00	f	2026-03-21 20:17:25	2026-03-21 20:17:25	1
22	4	1	09:00:00	16:00:00	t	2026-03-21 20:17:25	2026-03-21 20:17:25	1
23	4	2	09:00:00	16:00:00	t	2026-03-21 20:17:26	2026-03-21 20:17:26	1
24	4	3	09:00:00	16:00:00	t	2026-03-21 20:17:26	2026-03-21 20:17:26	1
25	4	4	09:00:00	16:00:00	t	2026-03-21 20:17:26	2026-03-21 20:17:26	1
26	4	5	09:00:00	16:00:00	t	2026-03-21 20:17:27	2026-03-21 20:17:27	1
27	4	6	09:00:00	13:00:00	f	2026-03-21 20:17:27	2026-03-21 20:17:27	1
28	4	7	09:00:00	13:00:00	f	2026-03-21 20:17:28	2026-03-21 20:17:28	1
29	5	1	09:00:00	18:00:00	t	2026-03-21 22:24:26	2026-03-21 22:24:26	3
30	5	2	09:00:00	18:00:00	t	2026-03-21 22:24:27	2026-03-21 22:24:27	3
31	5	3	09:00:00	18:00:00	t	2026-03-21 22:24:27	2026-03-21 22:24:27	3
32	5	4	09:00:00	18:00:00	t	2026-03-21 22:24:27	2026-03-21 22:24:27	3
33	5	5	09:00:00	18:00:00	t	2026-03-21 22:24:28	2026-03-21 22:24:28	3
34	5	6	09:00:00	18:00:00	t	2026-03-21 22:24:28	2026-03-21 22:24:28	3
35	6	1	09:00:00	18:00:00	t	2026-03-21 22:24:29	2026-03-21 22:24:29	3
36	6	2	09:00:00	18:00:00	t	2026-03-21 22:24:30	2026-03-21 22:24:30	3
37	6	3	09:00:00	18:00:00	t	2026-03-21 22:24:30	2026-03-21 22:24:30	3
38	6	4	09:00:00	18:00:00	t	2026-03-21 22:24:31	2026-03-21 22:24:31	3
39	6	5	09:00:00	18:00:00	t	2026-03-21 22:24:31	2026-03-21 22:24:31	3
40	6	6	09:00:00	18:00:00	t	2026-03-21 22:24:31	2026-03-21 22:24:31	3
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sections (id, about_us_show_section, about_us_text, about_us_icon, employees_show_section, employees_text, employees_icon, services_show_section, services_text, services_icon, products_show_section, products_text, products_icon, instagram_show_section, instagram_text, instagram_icon, whatsapp_show_section, whatsapp_title_1, whatsapp_title_2, whatsapp_title_3, whatsapp_icon, btn_whatsapp_button_text, created_at, updated_at, tenant_id) FROM stdin;
1	t	Sobre nosotros	icon-line-scissors fs-1	t	Nuestro equipo	icon-users fs-1	t	Nuestros servicios	icon-sticky-note1 fs-1	t	Productos	icon-tags fs-1	t	SEGUINOS EN INSTAGRAM	icon-instagram	t	¿TIENES ALGUNA DUDA?	No dudes en consultar!	Al recibir tu mensaje responderemos a la brevedad.	icon-whatsapp	Abrir chat	2026-03-21 20:17:00	2026-03-21 20:17:00	1
3	t	Sobre nosotros	icon-line-scissors fs-1	t	Nuestro equipo	icon-users fs-1	t	Nuestros servicios	icon-sticky-note1 fs-1	t	Productos	icon-tags fs-1	t	SEGUINOS EN INSTAGRAM	icon-instagram	t	¿TIENES ALGUNA DUDA?	No dudes en consultar!	Al recibir tu mensaje responderemos a la brevedad.	icon-whatsapp	Abrir chat	2026-03-21 22:24:14	2026-03-21 22:24:41	3
4	t	Sobre nosotros	icon-line-scissors fs-1	t	Nuestro equipo	icon-users fs-1	t	Nuestros servicios	icon-sticky-note1 fs-1	t	Productos	icon-tags fs-1	t	SEGUINOS EN INSTAGRAM	icon-instagram	t	¿TIENES ALGUNA DUDA?	No dudes en consultar!	Al recibir tu mensaje responderemos a la brevedad.	icon-whatsapp	Abrir chat	2026-03-23 01:02:45	2026-03-23 01:02:45	1
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, item_id, duration_time, created_at, updated_at, tenant_id) FROM stdin;
1	1	40	2026-03-21 20:16:55	2026-03-21 20:16:55	1
2	2	40	2026-03-21 20:16:56	2026-03-21 20:16:56	1
3	3	25	2026-03-21 20:16:56	2026-03-21 20:16:56	1
4	4	15	2026-03-21 20:16:57	2026-03-21 20:16:57	1
5	5	40	2026-03-21 20:16:57	2026-03-21 20:16:57	1
6	6	25	2026-03-21 20:16:57	2026-03-21 20:16:57	1
7	7	40	2026-03-21 20:16:58	2026-03-21 20:16:58	1
8	8	60	2026-03-21 20:16:58	2026-03-21 20:16:58	1
9	9	25	2026-03-21 20:16:59	2026-03-21 20:16:59	1
10	10	30	2026-03-21 20:16:59	2026-03-21 20:16:59	1
11	11	30	2026-03-21 20:16:59	2026-03-21 20:16:59	1
12	12	50	2026-03-21 20:17:00	2026-03-21 20:17:00	1
17	19	45	2026-03-21 22:24:21	2026-03-21 22:24:21	3
18	20	45	2026-03-21 22:24:22	2026-03-21 22:24:22	3
19	21	45	2026-03-21 22:24:22	2026-03-21 22:24:22	3
20	22	45	2026-03-21 22:24:23	2026-03-21 22:24:23	3
21	1	40	2026-03-23 01:02:41	2026-03-23 01:02:41	1
22	2	40	2026-03-23 01:02:41	2026-03-23 01:02:41	1
23	3	25	2026-03-23 01:02:42	2026-03-23 01:02:42	1
24	4	15	2026-03-23 01:02:42	2026-03-23 01:02:42	1
25	5	40	2026-03-23 01:02:42	2026-03-23 01:02:42	1
26	6	25	2026-03-23 01:02:43	2026-03-23 01:02:43	1
27	7	40	2026-03-23 01:02:43	2026-03-23 01:02:43	1
28	8	60	2026-03-23 01:02:43	2026-03-23 01:02:43	1
29	9	25	2026-03-23 01:02:44	2026-03-23 01:02:44	1
30	10	30	2026-03-23 01:02:44	2026-03-23 01:02:44	1
31	11	30	2026-03-23 01:02:45	2026-03-23 01:02:45	1
32	12	50	2026-03-23 01:02:45	2026-03-23 01:02:45	1
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, active_appointment, appointment_type, company_name, mail_contact, location, address, phone, currency_symbol, whatsapp, instagram_href, embedded_content_map, logo, banner, about_us, schedules, image_left, image_right, image_parallax, buttons_background_color, buttons_text_color, icons_color, titles_color, footer_background_color, footer_text_color, btn_whatsapp_background_color, btn_whatsapp_text_color, tenant_id) FROM stdin;
1	t	blacklist	Blessing S.A	contacto@blessingstar.com	Nicaragua	Ciudad Doral	84368899	$	50584368899		<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6544.182153698619!2d-56.19872150495073!3d-34.90416384253965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959f802d934f2cbd%3A0x23b5034c707bf9fe!2sCentro%2C%20Montevideo%2C%20Departamento%20de%20Montevideo!5e0!3m2!1ses!2suy!4v1700766872799!5m2!1ses!2suy" width="400" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>	your-logo.png	your-banner.jpg	Lorem ipsum, dolor sit amet consectetur adipisicing elit. Facere voluptatibus quasi ratione, mollitia laboriosam temporibus ipsam eum, officia hic ut consectetur animi rem, consequatur expedita?	Lun a Sab de 10:00 a 18:00	image_left.jpg	image_right.jpg	image_parallax.jpg	ff8585	ffffff	ff8585	ff8585	283747	ffffff	128c7e	ffffff	1
3	t	blacklist	Salón Demo	\N	\N	\N	\N	$	\N	\N	\N	your-logo.png	your-banner.jpg	Salón de demostración. Explora el sistema sin registrarte.	\N	image_left.jpg	image_right.jpg	image_parallax.jpg	ff8585	ffffff	ff8585	ff8585	283747	ffffff	128c7e	ffffff	3
4	t	blacklist	Blessing S.A	contacto@blessingstar.com	Nicaragua	Ciudad Doral	84368899	$	50584368899		<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6544.182153698619!2d-56.19872150495073!3d-34.90416384253965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959f802d934f2cbd%3A0x23b5034c707bf9fe!2sCentro%2C%20Montevideo%2C%20Departamento%20de%20Montevideo!5e0!3m2!1ses!2suy!4v1700766872799!5m2!1ses!2suy" width="400" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>	your-logo.png	your-banner.jpg	Lorem ipsum, dolor sit amet consectetur adipisicing elit. Facere voluptatibus quasi ratione, mollitia laboriosam temporibus ipsam eum, officia hic ut consectetur animi rem, consequatur expedita?	Lun a Sab de 10:00 a 18:00	image_left.jpg	image_right.jpg	image_parallax.jpg	ff8585	ffffff	ff8585	ff8585	283747	ffffff	128c7e	ffffff	1
\.


--
-- Data for Name: socials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.socials (id, name, icon, created_at, updated_at, tenant_id) FROM stdin;
1	Instagram	instagram	2026-03-21 20:16:49	2026-03-21 20:16:49	1
2	Linkedin	linkedin-in	2026-03-21 20:16:49	2026-03-21 20:16:49	1
3	Facebook	facebook	2026-03-21 20:16:50	2026-03-21 20:16:50	1
4	TikTok	tiktok	2026-03-21 20:16:50	2026-03-21 20:16:50	1
5	Website	link	2026-03-21 20:16:50	2026-03-21 20:16:50	1
11	Instagram	instagram	2026-03-21 22:24:13	2026-03-21 22:24:13	3
12	Linkedin	linkedin-in	2026-03-21 22:24:13	2026-03-21 22:24:13	3
13	Facebook	facebook	2026-03-21 22:24:13	2026-03-21 22:24:13	3
14	TikTok	tiktok	2026-03-21 22:24:13	2026-03-21 22:24:13	3
15	Website	link	2026-03-21 22:24:13	2026-03-21 22:24:13	3
\.


--
-- Data for Name: sponsors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sponsors (id, name, image, created_at, updated_at, deleted_at, tenant_id) FROM stdin;
1	Sponsor uno	sponsor-1.png	2026-03-21 20:17:28	2026-03-21 20:17:28	\N	1
2	Sponsor dos	sponsor-2.png	2026-03-21 20:17:28	2026-03-21 20:17:28	\N	1
3	Sponsor tres	sponsor-3.png	2026-03-21 20:17:29	2026-03-21 20:17:29	\N	1
4	Sponsor cuatro	sponsor-4.png	2026-03-21 20:17:29	2026-03-21 20:17:29	\N	1
5	Sponsor cinco	sponsor-5.png	2026-03-21 20:17:30	2026-03-21 20:17:30	\N	1
6	Sponsor seis	sponsor-6.png	2026-03-21 20:17:30	2026-03-21 20:17:30	\N	1
7	Sponsor siete	sponsor-7.png	2026-03-21 20:17:30	2026-03-21 20:17:30	\N	1
8	Sponsor ocho	sponsor-8.png	2026-03-21 20:17:31	2026-03-21 20:17:31	\N	1
\.


--
-- Data for Name: status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.status (id, name, description, bg_color, tenant_id) FROM stdin;
1	Cancelado	Agenda cancelada	danger	1
2	Pendiente	Pendiente de llegada	warning	1
3	En espera	En sala de espera	success	1
4	Atendiendo	En atención	info	1
5	Concluido	Agenda concluida	primary	1
11	Cancelado	Agenda cancelada	danger	3
12	Pendiente	Pendiente de llegada	warning	3
13	En espera	En sala de espera	success	3
14	Atendiendo	En atención	info	3
15	Concluido	Agenda concluida	primary	3
16	Cancelado	Agenda cancelada	danger	1
17	Pendiente	Pendiente de llegada	warning	1
18	En espera	En sala de espera	success	1
19	Atendiendo	En atención	info	1
20	Concluido	Agenda concluida	primary	1
\.


--
-- Data for Name: subscription_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_items (id, subscription_id, stripe_id, stripe_product, stripe_price, quantity, created_at, updated_at, meter_id, meter_event_name) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, tenant_id, type, stripe_id, stripe_status, stripe_price, quantity, trial_ends_at, ends_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, name, slug, billing_region, locale, created_at, updated_at, stripe_id, pm_type, pm_last_four, trial_ends_at, billing_email, plan_id, subscription_status, subscription_ends_at, scheduled_plan_id, past_due_since, is_demo) FROM stdin;
1	Default	default	\N	es	2026-03-21 20:14:41	2026-03-21 20:14:41	\N	\N	\N	2026-03-28 22:25:31	\N	\N	trial	\N	\N	\N	f
3	Salón Demo	demo	NI	es	2026-03-21 22:24:07	2026-03-21 22:24:07	\N	\N	\N	2026-03-28 22:25:31	\N	\N	trial	\N	\N	\N	t
\.


--
-- Data for Name: types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.types (id, name, description, bg_color, tenant_id) FROM stdin;
1	Flash	Son las que se ingresan desde el tablero cuando un cliente asiste sin una agenda previa	primary	1
2	Local	Se ingresan desde el panel administrativo con el propósito de reservar el horario de consulta a los clientes	info	1
3	Web	Son los clientes mismos quienes se agendan por su cuenta a través de la web	danger	1
7	Flash	Ingresadas desde el tablero sin agenda previa	primary	3
8	Local	Reservadas desde el panel administrativo	info	3
9	Web	Agendadas por el cliente en la web	danger	3
10	Flash	Son las que se ingresan desde el tablero cuando un cliente asiste sin una agenda previa	primary	1
11	Local	Se ingresan desde el panel administrativo con el propósito de reservar el horario de consulta a los clientes	info	1
12	Web	Son los clientes mismos quienes se agendan por su cuenta a través de la web	danger	1
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.units (id, name, abbreviation, active, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, email_verified_at, password, image, remember_token, created_at, updated_at, tenant_id) FROM stdin;
1	Consumidor final	consumidorfinal@example.com	\N	$2y$12$tT1kcSAL3HcHR4m0BSxQV.LhT9LoFfZfLuxX8PM22FF8wjRf50ylC	default.png	\N	2026-03-21 20:17:04	2026-03-21 20:17:04	3
2	Administrador	admin@blessingstar.com	\N	$2y$12$uE.GPC7VOIJXCoqhkbtEFu71CXxl30ph0ek9yjdyObKGSfgc4MwUu	default.png	\N	2026-03-21 20:17:07	2026-03-21 20:17:07	3
3	Milagros	customer@blessingstar.com	\N	$2y$12$Y0rUSBYXjnuCjlGuE5aIrutxHOLn271sGIkrDahAyJiG5zgcGkQ62	default.png	\N	2026-03-21 20:17:09	2026-03-21 20:17:09	3
6	Admin Demo	admin@demo.shearly.app	\N	$2y$12$iXHaVwAS.72YosFIhnztduwUuIS5ULizl7rFr7sOUIXys1sn05hAa	default.png	\N	2026-03-21 22:24:16	2026-03-21 22:24:16	3
7	Cliente Demo	cliente@demo.shearly.app	\N	$2y$12$1eeJvSGzz248/44R4Nh1V.EFPIjuUDpVg475HNF1uoT1VA.A9UrOO	default.png	\N	2026-03-21 22:24:18	2026-03-21 22:24:18	3
\.


--
-- Name: appointment_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.appointment_services_id_seq', 8, true);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.appointments_id_seq', 8, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 13, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 4, true);


--
-- Name: employee_social_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_social_id_seq', 8, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 6, true);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.images_id_seq', 1, false);


--
-- Name: instagram_feeds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.instagram_feeds_id_seq', 1, false);


--
-- Name: item_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.item_order_id_seq', 1, false);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.items_id_seq', 25, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 49, true);


--
-- Name: order_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_payments_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 1, false);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 1, false);


--
-- Name: personal_information_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_information_id_seq', 6, true);


--
-- Name: plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plans_id_seq', 3, true);


--
-- Name: positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.positions_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 4, true);


--
-- Name: providers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.providers_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.schedules_id_seq', 40, true);


--
-- Name: sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sections_id_seq', 4, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_id_seq', 32, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.settings_id_seq', 4, true);


--
-- Name: socials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.socials_id_seq', 16, true);


--
-- Name: sponsors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sponsors_id_seq', 8, true);


--
-- Name: status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.status_id_seq', 20, true);


--
-- Name: subscription_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscription_items_id_seq', 1, false);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 1, false);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tenants_id_seq', 3, true);


--
-- Name: types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.types_id_seq', 12, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.units_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: appointment_services appointment_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT appointment_services_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_tenant_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_tenant_id_name_unique UNIQUE (tenant_id, name);


--
-- Name: categories categories_tenant_id_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_tenant_id_slug_unique UNIQUE (tenant_id, slug);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: employee_social employee_social_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_social
    ADD CONSTRAINT employee_social_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- Name: images images_tenant_id_image_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_tenant_id_image_unique UNIQUE (tenant_id, image);


--
-- Name: instagram_feeds instagram_feeds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_feeds
    ADD CONSTRAINT instagram_feeds_pkey PRIMARY KEY (id);


--
-- Name: item_order item_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_order
    ADD CONSTRAINT item_order_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: items items_tenant_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_tenant_id_name_unique UNIQUE (tenant_id, name);


--
-- Name: items items_tenant_id_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_tenant_id_slug_unique UNIQUE (tenant_id, slug);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: model_has_permissions model_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_pkey PRIMARY KEY (permission_id, model_id, model_type);


--
-- Name: model_has_roles model_has_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_pkey PRIMARY KEY (role_id, model_id, model_type);


--
-- Name: order_payments order_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_payments
    ADD CONSTRAINT order_payments_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: permissions permissions_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: personal_information personal_information_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_information
    ADD CONSTRAINT personal_information_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: plans plans_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_slug_unique UNIQUE (slug);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: positions positions_tenant_id_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_tenant_id_slug_unique UNIQUE (tenant_id, slug);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: providers providers_tenant_id_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_tenant_id_email_unique UNIQUE (tenant_id, email);


--
-- Name: role_has_permissions role_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- Name: roles roles_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: socials socials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socials
    ADD CONSTRAINT socials_pkey PRIMARY KEY (id);


--
-- Name: socials socials_tenant_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socials
    ADD CONSTRAINT socials_tenant_id_name_unique UNIQUE (tenant_id, name);


--
-- Name: sponsors sponsors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsors
    ADD CONSTRAINT sponsors_pkey PRIMARY KEY (id);


--
-- Name: sponsors sponsors_tenant_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsors
    ADD CONSTRAINT sponsors_tenant_id_name_unique UNIQUE (tenant_id, name);


--
-- Name: status status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_pkey PRIMARY KEY (id);


--
-- Name: subscription_items subscription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_items
    ADD CONSTRAINT subscription_items_pkey PRIMARY KEY (id);


--
-- Name: subscription_items subscription_items_stripe_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_items
    ADD CONSTRAINT subscription_items_stripe_id_unique UNIQUE (stripe_id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_stripe_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_stripe_id_unique UNIQUE (stripe_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_unique UNIQUE (slug);


--
-- Name: types types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types
    ADD CONSTRAINT types_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: units units_tenant_id_abbreviation_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_tenant_id_abbreviation_unique UNIQUE (tenant_id, abbreviation);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_tenant_id_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_email_unique UNIQUE (tenant_id, email);


--
-- Name: idx_appointments_tenant_start; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_tenant_start ON public.appointments USING btree (tenant_id, start_time);


--
-- Name: idx_appointments_tenant_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_tenant_status ON public.appointments USING btree (tenant_id, status_id);


--
-- Name: idx_appointments_tenant_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_tenant_type ON public.appointments USING btree (tenant_id, type_id);


--
-- Name: idx_orders_tenant_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_tenant_payment ON public.orders USING btree (tenant_id, payment_status);


--
-- Name: idx_schedules_tenant_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_tenant_employee ON public.schedules USING btree (tenant_id, employee_id);


--
-- Name: item_order_tenant_id_order_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX item_order_tenant_id_order_id_index ON public.item_order USING btree (tenant_id, order_id);


--
-- Name: item_order_tenant_id_product_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX item_order_tenant_id_product_id_index ON public.item_order USING btree (tenant_id, product_id);


--
-- Name: model_has_permissions_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_permissions_model_id_model_type_index ON public.model_has_permissions USING btree (model_id, model_type);


--
-- Name: model_has_roles_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_roles_model_id_model_type_index ON public.model_has_roles USING btree (model_id, model_type);


--
-- Name: order_payments_tenant_id_method_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_payments_tenant_id_method_index ON public.order_payments USING btree (tenant_id, method);


--
-- Name: order_payments_tenant_id_order_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_payments_tenant_id_order_id_index ON public.order_payments USING btree (tenant_id, order_id);


--
-- Name: orders_payment_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_payment_status_index ON public.orders USING btree (payment_status);


--
-- Name: orders_tenant_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_tenant_id_created_at_index ON public.orders USING btree (tenant_id, created_at);


--
-- Name: orders_tenant_id_customer_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_tenant_id_customer_id_index ON public.orders USING btree (tenant_id, customer_id);


--
-- Name: orders_tenant_id_employee_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_tenant_id_employee_id_index ON public.orders USING btree (tenant_id, employee_id);


--
-- Name: orders_tenant_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_tenant_id_status_index ON public.orders USING btree (tenant_id, status);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: subscription_items_subscription_id_stripe_price_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscription_items_subscription_id_stripe_price_index ON public.subscription_items USING btree (subscription_id, stripe_price);


--
-- Name: subscriptions_tenant_id_stripe_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_tenant_id_stripe_status_index ON public.subscriptions USING btree (tenant_id, stripe_status);


--
-- Name: tenants_stripe_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_stripe_id_index ON public.tenants USING btree (stripe_id);


--
-- Name: appointment_services appointment_services_appointment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT appointment_services_appointment_id_foreign FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: appointment_services appointment_services_service_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT appointment_services_service_id_foreign FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: appointment_services appointment_services_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_services
    ADD CONSTRAINT appointment_services_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: appointments appointments_employee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: appointments appointments_status_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_status_id_foreign FOREIGN KEY (status_id) REFERENCES public.status(id);


--
-- Name: appointments appointments_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_type_id_foreign FOREIGN KEY (type_id) REFERENCES public.types(id);


--
-- Name: categories categories_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: customers customers_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: customers customers_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: employee_social employee_social_employee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_social
    ADD CONSTRAINT employee_social_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_social employee_social_social_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_social
    ADD CONSTRAINT employee_social_social_id_foreign FOREIGN KEY (social_id) REFERENCES public.socials(id);


--
-- Name: employee_social employee_social_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_social
    ADD CONSTRAINT employee_social_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: employees employees_positions_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_positions_id_foreign FOREIGN KEY (positions_id) REFERENCES public.positions(id) ON DELETE SET NULL;


--
-- Name: employees employees_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: images images_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: images images_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: instagram_feeds instagram_feeds_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instagram_feeds
    ADD CONSTRAINT instagram_feeds_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: item_order item_order_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_order
    ADD CONSTRAINT item_order_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: item_order item_order_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_order
    ADD CONSTRAINT item_order_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: item_order item_order_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_order
    ADD CONSTRAINT item_order_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: items items_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: items items_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: model_has_permissions model_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: model_has_roles model_has_roles_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: order_payments order_payments_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_payments
    ADD CONSTRAINT order_payments_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_payments order_payments_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_payments
    ADD CONSTRAINT order_payments_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: orders orders_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: orders orders_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: personal_information personal_information_employee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_information
    ADD CONSTRAINT personal_information_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: personal_information personal_information_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_information
    ADD CONSTRAINT personal_information_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: positions positions_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: products products_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: products products_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: providers providers_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: schedules schedules_employee_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_employee_id_foreign FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: schedules schedules_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sections sections_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: services services_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: services services_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: settings settings_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: socials socials_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.socials
    ADD CONSTRAINT socials_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sponsors sponsors_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsors
    ADD CONSTRAINT sponsors_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: status status_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT status_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: subscription_items subscription_items_subscription_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_items
    ADD CONSTRAINT subscription_items_subscription_id_foreign FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenants tenants_plan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_plan_id_foreign FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;


--
-- Name: tenants tenants_scheduled_plan_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_scheduled_plan_id_foreign FOREIGN KEY (scheduled_plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;


--
-- Name: types types_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types
    ADD CONSTRAINT types_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: units units_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: users users_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict LdREIlXb65YAWDvsHxw8r6udJ0OmapOutbTrJxtTbt0f5dgeoWwao9xNiyZEYyR

