def can_replace_with_ph(word):
    """
    Returns True if the first sound of the word can reasonably be replaced with 'ph'.
    For this context, we consider words starting with 'f', 'h', 'p', or a 'u' (as in 'u' pronounced 'you') as replaceable.
    """
    if not word:
        return False
    first = word[0].lower()
    # Replace if starts with 'f', 'h', or 'p'
    if first in {"f", "h", "p"}:
        return True
    # Replace if starts with 'u' and is followed by a consonant (to catch "u" pronounced "you")
    if first == "u" and len(word) > 1 and word[1].lower() not in "aeiou":
        return True
    return False


def replace_first_sound_with_ph(word):
    """
    Replace the first sound of the word with 'ph' according to the rules.
    """
    if not word:
        return word
    first = word[0].lower()
    if first == "f":
        return "ph" + word[1:]
    elif first == "h":
        return "ph" + word[1:]
    elif first == "p":
        return "ph" + word[1:]
    elif first == "u" and len(word) > 1 and word[1].lower() not in "aeiou":
        return "ph" + word
    else:
        return word


def process_words(input_filename, output_filename):
    with open(input_filename, "r") as infile, open(output_filename, "w") as outfile:
        for line in infile:
            word = line.strip()
            if not word:
                continue
            if can_replace_with_ph(word):
                new_word = replace_first_sound_with_ph(word)
                outfile.write(new_word + "\n")


# Run the process for popular.txt -> phictionary.txt
process_words("popular.txt", "phictionary.txt")
