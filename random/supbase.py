def insert_phictionary_words_to_db(phictionary_file):
    """
    Save each insert command as a line of text in db.txt for all words in phictionary.txt.
    """
    with open(phictionary_file, "r") as infile, open("db.txt", "w") as dbfile:
        words = [line.strip() for line in infile if line.strip()]
        for word in words:
            safe_word = word.replace("'", "''")
            dbfile.write(
                f"INSERT INTO phictionary_words (word, upvotes, downvotes) VALUES ('{safe_word}', 0, 0) ON CONFLICT (word) DO NOTHING;\n"
            )


insert_phictionary_words_to_db("phictionary.txt")
