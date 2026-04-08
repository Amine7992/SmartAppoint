const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const REVIEW_PATH = path.join(DATA_DIR, 'admin-professional-review.json');

const ensureReviewFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(REVIEW_PATH)) {
    fs.writeFileSync(REVIEW_PATH, JSON.stringify({}, null, 2));
  }
};

const readReviewState = () => {
  ensureReviewFile();

  try {
    return JSON.parse(fs.readFileSync(REVIEW_PATH, 'utf8'));
  } catch (error) {
    return {};
  }
};

const writeReviewState = (state) => {
  ensureReviewFile();
  fs.writeFileSync(REVIEW_PATH, JSON.stringify(state, null, 2));
};

const getProfessionalReviewStatus = (id) => readReviewState()[id] || null;

const setProfessionalReviewStatus = (id, status) => {
  const state = readReviewState();
  state[id] = status;
  writeReviewState(state);
  return status;
};

module.exports = {
  getProfessionalReviewStatus,
  setProfessionalReviewStatus,
};
