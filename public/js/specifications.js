const Theming = {
  apply: (spec) => {
    const dynamicBody = document.getElementById('dynamic-body');
    if (!dynamicBody) return;
    
    dynamicBody.className = 'min-h-screen transition duration-500';
    
    if (spec === 'Dyslexia') {
      dynamicBody.classList.add('bg-amber-50', 'text-slate-800', 'dyslexia-mode');
    } else if (spec === 'ADHD') {
      dynamicBody.classList.add('bg-teal-50', 'text-slate-800');
    } else if (spec === 'Blind') {
      dynamicBody.classList.add('bg-slate-900', 'text-white');
    } else {
      dynamicBody.classList.add('bg-slate-50', 'text-slate-800');
    }
  }
};

class AdhdReadingMask {
  constructor(text, passageEl, prevBtnEl, nextBtnEl, controlsEl) {
    const sanitizedText = text.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    this.sentences = sanitizedText.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [sanitizedText];
    this.sentences = this.sentences.map(s => s.trim()).filter(s => s.length > 0);
    
    this.index = 0;
    this.passageEl = passageEl;
    this.prevBtnEl = prevBtnEl;
    this.nextBtnEl = nextBtnEl;
    this.controlsEl = controlsEl;
    
    if (this.controlsEl) this.controlsEl.classList.remove('hidden');
    
    if (this.prevBtnEl) this.prevBtnEl.onclick = () => this.prevSentence();
    if (this.nextBtnEl) this.nextBtnEl.onclick = () => this.nextSentence();
    
    this.updateUI();
  }
  
  updateUI() {
    let html = '';
    this.sentences.forEach((sentence, idx) => {
      let isVisible = idx === this.index;
      // Adds a Tailwind yellow highlight background to the active sentence
      let activeClass = isVisible ? 'adhd-active-sentence bg-yellow-200 px-1 rounded-md' : 'adhd-masked-sentence';
      html += `<span class="${activeClass} transition-all duration-300">${sentence} </span>`;
    });
    this.passageEl.innerHTML = html;
    
    // Disable 'Previous' if we are on the first sentence
    if (this.prevBtnEl) {
      this.prevBtnEl.disabled = this.index === 0;
    }
    
    if (this.nextBtnEl) {
      this.nextBtnEl.innerText = this.index >= this.sentences.length - 1 ? 'Finish Reading' : 'Next Sentence';
    }

    // Auto-scroll: Smoothly centers the active sentence on the screen
    setTimeout(() => {
      const activeSentence = this.passageEl.querySelector('.adhd-active-sentence');
      if (activeSentence) {
        activeSentence.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }
  
  nextSentence() {
    if (this.index < this.sentences.length - 1) {
      this.index++;
      this.updateUI();
    } else {
      if (this.controlsEl) this.controlsEl.classList.add('hidden'); // Hide bar when finished
    }
  }

  prevSentence() {
    if (this.index > 0) {
      this.index--;
      this.updateUI();
    }
  }
}

class AdhdQuizMask {
  constructor(nextBtnEl, submitBtnEl) {
    this.index = 0;
    this.nextBtnEl = nextBtnEl;
    this.submitBtnEl = submitBtnEl;
    
    this.nextBtnEl.classList.remove('hidden');
    this.submitBtnEl.classList.add('hidden');
    
    this.nextBtnEl.onclick = () => this.nextQuiz();
    this.updateUI();
  }
  
  updateUI() {
    const qElements = document.querySelectorAll('.quiz-question-block');
    if(qElements.length === 0) return;
    
    qElements.forEach((el, idx) => {
      // Remove old classes first
      el.classList.remove('adhd-active-question', 'adhd-masked-question');
      
      if (idx === this.index) {
        el.classList.add('adhd-active-question');
      } else {
        el.classList.add('adhd-masked-question');
      }
    });
    
    if (this.index >= qElements.length - 1) {
      this.nextBtnEl.classList.add('hidden');
      this.submitBtnEl.classList.remove('hidden');
    } else {
      this.nextBtnEl.classList.remove('hidden');
      this.submitBtnEl.classList.add('hidden');
    }
  }
  
  nextQuiz() {
    const qElements = document.querySelectorAll('.quiz-question-block');
    if (this.index < qElements.length - 1) {
      this.index++;
      this.updateUI();
    }
  }
}
  
