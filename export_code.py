import os

# Set the folder to scan (current folder)
base_folder = '.'
output_file = 'all_code.txt'

with open(output_file, 'w', encoding='utf-8') as outfile:
    # Walk through directories
    for root, dirs, files in os.walk(base_folder):
        # Sort folders and files to keep consistent order
        dirs.sort()
        files.sort()
        for file in files:
            # Skip the output file itself
            if file == output_file:
                continue
            file_path = os.path.join(root, file)
            # Write file header
            outfile.write(f"#{file_path}\n")
            # Write file content
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                outfile.write(f.read())
            # Separator
            outfile.write("\n------\n")

print(f"All files have been written to {output_file}")
