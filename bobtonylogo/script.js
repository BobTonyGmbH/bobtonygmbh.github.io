document.addEventListener('DOMContentLoaded', function () {
    const svgGallery = document.getElementById('svgGallery');
    const colorInputsContainer = document.getElementById('colorInputs');
    const applyChangesButton = document.getElementById('applyChanges');
    const resolutionInput = document.getElementById('resolution');

    const svgFolder = './svgs/';

    const originalSVGs = {};
    const editedSVGs = {};

    async function loadSVGs() {
        try {
            const response = await fetch(`${svgFolder}`);
            const text = await response.text();
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(text, 'text/html');
            const svgFiles = Array.from(htmlDoc.querySelectorAll('a'))
                .filter(a => a.href.endsWith('.svg'))
                .map(a => a.href.split('/').pop());

            svgFiles.forEach(file => {
                fetch(`${svgFolder}${file}`)
                    .then(response => response.text())
                    .then(svgContent => {
                        originalSVGs[file] = svgContent;
                        editedSVGs[file] = svgContent;

                        const svgPreview = document.createElement('div');
                        svgPreview.className = 'svg-preview';

                        const img = document.createElement('img');
                        img.src = `${svgFolder}${file}`;
                        img.alt = file;

                        const downloadButton = document.createElement('a');
                        downloadButton.textContent = 'Download';
                        downloadButton.className = 'download-button';
                        downloadButton.addEventListener('click', () => downloadAsPNG(editedSVGs[file], file));

                        svgPreview.appendChild(img);
                        svgPreview.appendChild(downloadButton);
                        svgGallery.appendChild(svgPreview);
                    });
            });
        } catch (error) {
            console.error('Fehler beim Laden der SVGs:', error);
        }
    }

    function downloadAsPNG(svgContent, filename) {
        const resolution = parseInt(resolutionInput.value, 10);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = function () {
            canvas.width = resolution;
            canvas.height = resolution;
            ctx.drawImage(img, 0, 0, resolution, resolution);

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = filename.replace('.svg', '.png');
            link.click();
        };
        img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    }

    applyChangesButton.addEventListener('click', function () {
        const colorInputs = Array.from(colorInputsContainer.querySelectorAll('input'));
        const colorMap = colorInputs.reduce((map, input) => {
            if (input.value.trim()) {
                map[input.dataset.originalColor] = input.value.trim();
            }
            return map;
        }, {});

        Object.keys(originalSVGs).forEach(file => {
            editedSVGs[file] = originalSVGs[file];
        });

        Object.keys(editedSVGs).forEach(file => {
            let updatedSVG = editedSVGs[file];
            for (const [oldColor, newColor] of Object.entries(colorMap)) {
                updatedSVG = updatedSVG.replace(new RegExp(oldColor, 'gi'), newColor);
            }
            editedSVGs[file] = updatedSVG;

            const img = svgGallery.querySelector(`img[alt="${file}"]`);
            if (img) {
                img.src = `data:image/svg+xml;utf8,${encodeURIComponent(updatedSVG)}`;
            }
        });
    });

    loadSVGs();
});
