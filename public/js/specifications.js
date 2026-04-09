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
  constructor(text, passageEl, nextBtnEl, controlsEl) {
    this.sentences = text.split(/(?<=\.|\?|\!)\s+/).filter(s => s.trim().length > 0);
    this.index = 0;
    this.passageEl = passageEl;
    this.nextBtnEl = nextBtnEl;
    this.controlsEl = controlsEl;
    
    if (this.controlsEl) this.controlsEl.classList.remove('hidden');
    
    // override native click to prevent multiple assignments if reconstructed
    this.nextBtnEl.onclick = () => this.nextSentence();
    this.updateUI();
  }
  
  updateUI() {
    let html = '';
    this.sentences.forEach((sentence, idx) => {
      let isVisible = idx === this.index;
      html += `<span class="adhd-masked-sentence ${isVisible ? 'adhd-active-sentence' : ''}">${sentence} </span>`;
    });
    this.passageEl.innerHTML = html;
    this.nextBtnEl.innerText = this.index >= this.sentences.length - 1 ? 'Finish' : 'Next Sentence';
  }
  
  nextSentence() {
    if (this.index < this.sentences.length - 1) {
      this.index++;
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
      if (idx === this.index) {
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
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
