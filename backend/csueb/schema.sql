DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS post;
DROP TABLE IF EXISTS comment;

CREATE TABLE IF NOT EXISTS  user (
    id integer PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    image TEXT
);

CREATE TABLE IF NOT EXISTS  post (
    id integer PRIMARY KEY AUTOINCREMENT,
    author_uuid TEXT NOT NULL,
    post_uuid TEXT UNIQUE NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    FOREIGN KEY (author_uuid) REFERENCES user (uuid)
);

CREATE TABLE IF NOT EXISTS  comment (
    id integer PRIMARY KEY AUTOINCREMENT,
    author_uuid TEXT NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    body TEXT NOT NULL,
    parent_uuid TEXT NOT NULL,
    FOREIGN KEY (author_uuid) REFERENCES user (uuid),
    FOREIGN KEY (parent_uuid) REFERENCES post (post_uuid)
);


CREATE TABLE IF NOT EXISTS profile (
    id integer PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL,
    desc TEXT,
    pfp_link TEXT,
    major TEXT,
    FOREIGN KEY (uuid) REFERENCES user (uuid)
);

