
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


const isValidPassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};


const validateUserRegistration = (req, res, next) => {
  const { email, password, name } = req.body;

  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (!isValidPassword(password)) {
    errors.push('Password must be at least 6 characters long');
  }

  if (name && typeof name !== 'string') {
    errors.push('Name must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};


const validateDeck = (req, res, next) => {
  const { name, description } = req.body;

  const errors = [];

  if (!name) {
    errors.push('Deck name is required');
  } else if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Deck name must be a non-empty string');
  } else if (name.length > 100) {
    errors.push('Deck name must be less than 100 characters');
  }

  if (description && typeof description !== 'string') {
    errors.push('Description must be a string');
  } else if (description && description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};


const validateCard = (req, res, next) => {
  const { frontText, backText, deckId, memorized } = req.body;

  const errors = [];

  if (!frontText) {
    errors.push('Front text is required');
  } else if (typeof frontText !== 'string' || frontText.trim().length === 0) {
    errors.push('Front text must be a non-empty string');
  } else if (frontText.length > 500) {
    errors.push('Front text must be less than 500 characters');
  }

  if (!backText) {
    errors.push('Back text is required');
  } else if (typeof backText !== 'string' || backText.trim().length === 0) {
    errors.push('Back text must be a non-empty string');
  } else if (backText.length > 500) {
    errors.push('Back text must be less than 500 characters');
  }

  if (deckId && typeof deckId !== 'string') {
    errors.push('Deck ID must be a string');
  }

  if (memorized !== undefined && typeof memorized !== 'boolean') {
    errors.push('Memorized must be a boolean');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};


const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive integer',
    });
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be a positive integer between 1 and 100',
    });
  }

  req.pagination = {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };

  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateDeck,
  validateCard,
  validatePagination,
};
