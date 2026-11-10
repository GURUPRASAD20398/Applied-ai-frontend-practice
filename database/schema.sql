-- =====================================================================
-- E-Bookstore PostgreSQL schema (PostgreSQL 15+)
-- The JSON files in /server/data mirror these tables 1:1 (camelCase <-> snake_case).
-- Run:  psql -d ebookstore -f database/schema.sql
-- =====================================================================

BEGIN;

CREATE TYPE user_role       AS ENUM ('customer', 'admin');
CREATE TYPE order_status    AS ENUM ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled');
CREATE TYPE payment_method  AS ENUM ('credit_card', 'debit_card', 'upi', 'net_banking', 'wallet');
CREATE TYPE payment_status  AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE reward_type     AS ENUM ('earn', 'redeem', 'bonus', 'adjustment');

-- Shared trigger to maintain updated_at
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Users  (password_hash stores a salted scrypt/argon2 hash, never plaintext)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           VARCHAR(100)  NOT NULL,
  email          VARCHAR(254)  NOT NULL,
  password_hash  TEXT          NOT NULL,
  role           user_role     NOT NULL DEFAULT 'customer',
  reward_points  INTEGER       NOT NULL DEFAULT 0 CHECK (reward_points >= 0),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name  VARCHAR(80) NOT NULL UNIQUE,
  slug  VARCHAR(80) NOT NULL UNIQUE,
  color CHAR(7)
);

-- ---------------------------------------------------------------------
-- Books
-- ---------------------------------------------------------------------
CREATE TABLE books (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title           VARCHAR(200)  NOT NULL,
  author          VARCHAR(120)  NOT NULL,
  category_id     BIGINT        NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  publisher       VARCHAR(120)  NOT NULL,
  isbn            VARCHAR(20),
  price           NUMERIC(10,2) NOT NULL CHECK (price > 0),
  rating          NUMERIC(2,1)  NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count    INTEGER       NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  stock           INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image           TEXT,
  description     TEXT,
  delivery_days   SMALLINT      NOT NULL DEFAULT 4 CHECK (delivery_days BETWEEN 1 AND 30),
  published_date  DATE,
  is_featured     BOOLEAN       NOT NULL DEFAULT FALSE,
  is_bestseller   BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_books_category   ON books (category_id);
CREATE INDEX idx_books_author     ON books (author);
CREATE INDEX idx_books_publisher  ON books (publisher);
CREATE INDEX idx_books_price      ON books (price);
CREATE INDEX idx_books_published  ON books (published_date DESC);
CREATE INDEX idx_books_search ON books
  USING GIN (to_tsvector('english', title || ' ' || author || ' ' || coalesce(description, '')));
CREATE TRIGGER trg_books_updated BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------
CREATE TABLE addresses (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name     VARCHAR(80)  NOT NULL,
  phone         VARCHAR(15)  NOT NULL,
  house_number  VARCHAR(40)  NOT NULL,
  street        VARCHAR(120) NOT NULL,
  city          VARCHAR(60)  NOT NULL,
  state         VARCHAR(60)  NOT NULL,
  country       VARCHAR(60)  NOT NULL,
  pincode       VARCHAR(10)  NOT NULL,
  is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON addresses (user_id);
-- At most one default address per user
CREATE UNIQUE INDEX uq_addresses_one_default ON addresses (user_id) WHERE is_default;
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Cart (persisted per user)
-- ---------------------------------------------------------------------
CREATE TABLE cart_items (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         BIGINT   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id         BIGINT   NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity        SMALLINT NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 10),
  saved_for_later BOOLEAN  NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

-- ---------------------------------------------------------------------
-- Wishlists
-- ---------------------------------------------------------------------
CREATE TABLE wishlists (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id   BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

-- ---------------------------------------------------------------------
-- Book views (feeds the recommendation engine)
-- ---------------------------------------------------------------------
CREATE TABLE book_views (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id    BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

-- ---------------------------------------------------------------------
-- Payments (only non-sensitive references; never store PAN or CVV)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        BIGINT         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  method         payment_method NOT NULL,
  amount         NUMERIC(10,2)  NOT NULL CHECK (amount >= 0),
  reference      VARCHAR(100),                 -- masked card (**** 4242), UPI id, bank or wallet name
  status         payment_status NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(40)    NOT NULL UNIQUE,
  used           BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_user ON payments (user_id);

-- ---------------------------------------------------------------------
-- Orders  (address is snapshotted so later edits don't alter history)
-- ---------------------------------------------------------------------
CREATE TABLE orders (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number        VARCHAR(20)    NOT NULL UNIQUE,
  user_id             BIGINT         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  payment_id          BIGINT         UNIQUE REFERENCES payments(id),
  address_snapshot    JSONB          NOT NULL,
  subtotal            NUMERIC(10,2)  NOT NULL CHECK (subtotal >= 0),
  tax                 NUMERIC(10,2)  NOT NULL CHECK (tax >= 0),
  points_redeemed     INTEGER        NOT NULL DEFAULT 0 CHECK (points_redeemed >= 0),
  discount            NUMERIC(10,2)  NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total               NUMERIC(10,2)  NOT NULL CHECK (total >= 0),
  status              order_status   NOT NULL DEFAULT 'Confirmed',
  estimated_delivery  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Order items (title/price snapshotted at purchase time)
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id  BIGINT        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id   BIGINT        REFERENCES books(id) ON DELETE SET NULL,
  title     VARCHAR(200)  NOT NULL,
  author    VARCHAR(120),
  image     TEXT,
  price     NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  quantity  SMALLINT      NOT NULL CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_book  ON order_items (book_id);

-- ---------------------------------------------------------------------
-- Reward points ledger (users.reward_points is the cached balance)
-- ---------------------------------------------------------------------
CREATE TABLE reward_points (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id    BIGINT      REFERENCES orders(id) ON DELETE SET NULL,
  points      INTEGER     NOT NULL CHECK (points <> 0),   -- positive = earn, negative = redeem
  type        reward_type NOT NULL,
  description VARCHAR(200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reward_points_user ON reward_points (user_id, created_at DESC);

COMMIT;
