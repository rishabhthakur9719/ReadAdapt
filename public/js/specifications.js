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
    // 1. Make the container relative so the black filter can cover it
    this.passageEl.classList.add('relative');

    // 2. The Black Filter: We use negative margins (-inset-6) to make it stretch 
    // to the edges of the white container box, covering the padding too.
    let html = '<div class="absolute -inset-6 md:-inset-10 bg-slate-900/85 z-10 rounded-3xl pointer-events-none transition-all duration-500"></div>';

    // 3. The Text Wrapper
    html += '<div class="relative">';

    this.sentences.forEach((sentence, idx) => {
      let isVisible = idx === this.index;
      
      // Active: Elevated ABOVE the black filter (z-20), bright background, popping out
      // Inactive: Pushed BEHIND the black filter (z-0), letting the darkness shadow it
      let activeClass = isVisible 
        ? 'relative z-20 bg-white text-slate-900 px-2 py-1 rounded-xl font-bold shadow-[0_0_20px_rgba(0,0,0,0.6)] transition-all duration-300' 
        : 'relative z-0 text-slate-800 transition-all duration-300';
      
      html += `<span class="${activeClass}">${sentence} </span>`;
    });
    
    html += '</div>';
    this.passageEl.innerHTML = html;
    
    // Disable 'Previous' if we are on the first sentence
    if (this.prevBtnEl) {
      this.prevBtnEl.disabled = this.index === 0;
    }
    
    // SVG logic for the Next/Finish arrow
    if (this.nextBtnEl) {
      if (this.index >= this.sentences.length - 1) {
        this.nextBtnEl.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
      } else {
        this.nextBtnEl.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
      }
    }


    // Auto-scroll: Smoothly centers the active sentence
    setTimeout(() => {
      const activeSentence = this.passageEl.querySelector('.opacity-100'); // Targeted by Tailwind class now
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
      // Ensure the smooth fade transition is always applied
      el.classList.add('transition-opacity', 'duration-300');
      
      if (idx === this.index) {
        // Active Question: Fully visible, clickable
        el.classList.add('opacity-100');
        el.classList.remove('opacity-20', 'pointer-events-none');
      } else {
        // Shadowed Question: 20% opacity, unclickable
        el.classList.add('opacity-20', 'pointer-events-none');
        el.classList.remove('opacity-100');
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
  
