import random


def apply_ph_rules(word):
    # Apply the rules in order:
    # 1. replace 'f' with 'ph'
    # 2. prefix 'u' with 'ph'
    # 3. replace 'h' with 'ph'
    # 4. replace 'p' with 'ph'
    # Otherwise, just prefix with 'ph'
    w = word
    if "f" in w:
        w = w.replace("f", "ph")
    elif w.startswith("u"):
        w = "ph" + w
    elif "h" in w:
        w = w.replace("h", "ph")
    elif "p" in w:
        w = w.replace("p", "ph")
    else:
        w = "ph" + w
    return w


def get_ph_words(filename):
    from collections import defaultdict

    words_by_letter = defaultdict(list)
    with open(filename, "r") as f:
        for line in f:
            word = line.strip()
            if word:
                first = word[0].lower()
                words_by_letter[first].append(word)
    result = {}
    for letter in sorted(words_by_letter.keys()):
        words = words_by_letter[letter]
        if len(words) < 5:
            sample = words
        else:
            sample = random.sample(words, 5)
        ph_words = [apply_ph_rules(w) for w in sample]
        result[letter] = ph_words
    return result


# Example usage:
ph_words_by_letter = get_ph_words("popular.txt")
for letter, ph_words in ph_words_by_letter.items():
    print(f"{letter}: {', '.join(ph_words)}")
