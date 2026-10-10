#!/usr/bin/env bash
# Unpack the newest metro map zip (MM.downloadButton) from ~/Downloads into a pipeline's docs.
# Usage: install_metromaps.sh <zip-name-prefix> <dest-dir>
#   e.g. install_metromaps.sh proteinfamilies_metromaps proteinfamilies/docs/images
set -euo pipefail

prefix=${1:?zip name prefix, e.g. proteinfamilies_metromaps}
dest=${2:?destination, e.g. <pipeline>/docs/images}

# Chrome names repeated saves "<name> (1).zip"; take the newest
mapfile -t zips < <(ls -t "$HOME/Downloads/$prefix"*.zip 2>/dev/null)
[[ ${#zips[@]} -gt 0 ]] || { echo "no $prefix*.zip in ~/Downloads" >&2; exit 1; }
unzip -o "${zips[0]}" -d "$dest"
rm "${zips[0]}"

# draw.io SVGs end without a newline, which the nf-core end-of-file-fixer pre-commit hook rejects
for svg in "$dest"/*.svg; do
    [[ -z "$(tail -c 1 "$svg")" ]] || echo >> "$svg"
done

if [[ ${#zips[@]} -gt 1 ]]; then
    echo "older matching zips left in ~/Downloads (duplicate Save dialogs?):" >&2
    printf '  %s\n' "${zips[@]:1}" >&2
fi
