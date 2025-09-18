CREATE TABLE phictionary_words (
    word TEXT PRIMARY KEY UNIQUE NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0
);

select * from phictionary_words where word = 'phable';