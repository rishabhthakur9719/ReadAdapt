class Api {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`/api${endpoint}`, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'API Request failed');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth Methods
  async login(email, password) {
    const data = await this.request('/auth/login', 'POST', { email, password });
    this.setToken(data.token);
    return data;
  }

  async register(email, password) {
    const data = await this.request('/auth/register', 'POST', { email, password });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  async completeOnboarding(profileData) {
    return await this.request('/auth/onboard', 'POST', profileData);
  }

  // Eval Methods & AI History Methods
  async sendEvaluation(transcript, targetText) {
    return await this.request('/evaluate', 'POST', { transcript, targetText });
  }

  async getReports() {
    return await this.request('/reports', 'GET');
  }

  async generateContent(topic, wordLimit) {
    return await this.request('/generate-content', 'POST', { topic, wordLimit });
  }

  async generateQuiz(topic, numQuestions, difficulty) {
    return await this.request('/generate-quiz', 'POST', { topic, numQuestions, difficulty });
  }

  async submitQuizReport(topic, score, totalQuestions) {
    return await this.request('/quiz-report', 'POST', { topic, score, totalQuestions });
  }

  async getQuizzes() {
    return await this.request('/quizzes', 'GET');
  }
}

const api = new Api();
