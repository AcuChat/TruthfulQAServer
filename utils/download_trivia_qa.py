from datasets import load_dataset
import json

def download_and_save_dataset():
    # Load the dataset with the 'rc' configuration, using streaming
    print("Loading dataset...", flush=True)
    dataset = load_dataset("trivia_qa", 'unfiltered', streaming=True)

    # Open a file to append the data
    with open('trivia_qa.txt', 'a', encoding='utf-8') as f:
        # Iterate through all splits in the dataset
        for split in dataset.keys():
            print(f"Processing {split} split...", flush=True)
            # Iterate through all examples in the split
            for example in dataset[split]:
                # Convert the example to a JSON string
                json_str = json.dumps(example)
                # Write the JSON string to the file, followed by a newline
                f.write(json_str + '\n')
                # Flush the file buffer to ensure data is written immediately
                f.flush()

    print("Dataset has been downloaded and saved to 'trivia_qa.txt'", flush=True)

if __name__ == "__main__":
    download_and_save_dataset()