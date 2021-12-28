create table list (
    id serial primary key,
    "name" text,
    "description" text,
    created_at timestamp without time zone default now(),
    last_modified timestamp without time zone default now(),
    comment text,
    store text,
    meeting_location_longitude DECIMAL(10,8),
    meeting_location_latitude DECIMAL(10,8),
    "status" text DEFAULT 'open'
);

create table user_list (
    user_id int,
    list_id int,
    is_owner boolean default false,
    primary key(user_id, list_id)
);

create table "user"(
    id serial primary key,
    email varchar(255) unique,
    password varchar(255),
    salt varchar(255)
);

create table user_account(
    list_id int primary key,
    email text,
    password text,
    carbon_emission_saved int,
    rating DECIMAL(1,1)
);

create table item (
    id serial primary key,
    list_id int,
    item_name text,
    price DECIMAL(10,2),
    quantity int
);

create table comment (
    id serial primary key,
    user_id int,
    list_id int,
    comment text,
    created_at timestamp without time zone default now()
);

create table general_location(
    list_id int primary key,
    user_longitude DECIMAL(10,8),
    user_latitude DECIMAL(11,8)
);