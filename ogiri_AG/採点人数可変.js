document.addEventListener('DOMContentLoaded', () => {
    const judgeCountSelect = document.getElementById('judge-count');
    const judgesContainer = document.getElementById('judges-container');
    const totalScoreElement = document.getElementById('total-score');
    const resultDetails = document.getElementById('result-details');
    const statsRow = document.getElementById('stats-row');
    const formulaRow = document.getElementById('formula-row');

    let judgeCount = 4;
    let scores = [];

    // Initialize the UI elements based on selected number of judges
    const initJudges = () => {
        judgeCount = parseInt(judgeCountSelect.value, 10);
        scores = Array(judgeCount).fill(null);

        judgesContainer.innerHTML = '';
        for (let i = 0; i < judgeCount; i++) {
            const card = document.createElement('div');
            card.className = 'judge-card';
            card.id = `judge-${i}`;

            const badge = document.createElement('div');
            badge.className = 'status-badge';
            badge.id = `badge-${i}`;

            const title = document.createElement('h3');
            title.textContent = `審査員 ${i + 1}`;

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.placeholder = '-';
            input.dataset.index = i;

            // Auto-calculate on input change
            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                scores[i] = isNaN(val) ? null : val;
                calculateAndRender();
            });

            // Focus on next input on Enter
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const nextInput = document.querySelector(`input[data-index="${i + 1}"]`);
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        input.blur();
                    }
                }
            });

            card.appendChild(badge);
            card.appendChild(title);
            card.appendChild(input);
            judgesContainer.appendChild(card);
        }

        calculateAndRender();

        // Focus first input automatically
        const firstInput = document.querySelector(`input[data-index="0"]`);
        if (firstInput) firstInput.focus();
    };

    judgeCountSelect.addEventListener('change', initJudges);

    const calculateAndRender = () => {
        // Reset visual state
        document.querySelectorAll('.judge-card').forEach(el => {
            el.classList.remove('excluded', 'included');
        });
        document.querySelectorAll('.status-badge').forEach(el => {
            el.textContent = '';
        });

        // Filter out nulls to check if we can compute
        const validScores = scores.map((s, i) => ({ value: s, index: i })).filter(s => s.value !== null);

        if (validScores.length !== judgeCount) {
            totalScoreElement.textContent = '-';
            resultDetails.style.display = 'none';
            totalScoreElement.style.color = 'var(--text-secondary)';
            return;
        }

        totalScoreElement.style.color = 'var(--primary-color)';
        resultDetails.style.display = 'block';

        const scoreValues = validScores.map(v => v.value);
        const sum = scoreValues.reduce((a, b) => a + b, 0);
        const avg = sum / judgeCount;

        let excludedIndices = [];

        if (judgeCount > 4) {
            const excludeCount = judgeCount - 4; // 5 people -> exclude 1, 6 people -> exclude 2

            // Calculate exact integer distances for sorting to avoid floating point errors.
            // distInt is Math.abs(value * judgeCount - sum) which is exactly proportional to the distance.
            const withDistances = validScores.map(s => ({
                ...s,
                distInt: Math.abs(s.value * judgeCount - sum)
            }));

            // Sort to find which to exclude
            withDistances.sort((a, b) => {
                // Descending by distance (farthest first)
                if (b.distInt !== a.distInt) {
                    return b.distInt - a.distInt;
                }
                // Ascending by value if distance is same (smaller value removed first)
                return a.value - b.value;
            });

            const excluded = withDistances.slice(0, excludeCount);
            excludedIndices = excluded.map(e => e.index);
        }

        // Final scores logic
        let finalProduct = 1;
        let includedValues = [];
        let excludedValuesStr = [];

        validScores.forEach(s => {
            const card = document.getElementById(`judge-${s.index}`);
            const badge = document.getElementById(`badge-${s.index}`);

            if (excludedIndices.includes(s.index)) {
                card.classList.add('excluded');
                badge.textContent = '除外';
                excludedValuesStr.push(s.value);
            } else {
                card.classList.add('included');
                badge.textContent = '採用';
                finalProduct *= s.value;
                includedValues.push(s.value);
            }
        });

        totalScoreElement.textContent = finalProduct;

        // Update details breakdown
        let statsHtml = `<span>平均値: <strong>${avg.toFixed(2)}</strong></span>`;
        if (excludedValuesStr.length > 0) {
            statsHtml += `<span>除外: <strong>${excludedValuesStr.join(', ')}</strong></span>`;
        }
        statsRow.innerHTML = statsHtml;

        formulaRow.textContent = `${includedValues.join(' × ')} = ${finalProduct}`;
    };

    // Initialize application
    initJudges();
});
