[ -e westpunkte-helper.xpi ] && rm westpunkte-helper.xpi

zip -r westpunkte-helper.xpi \
    content.js \
    manifest.json \
    poppins \
    popup.html \
    popup.js \
    trans-westbahn.svg
