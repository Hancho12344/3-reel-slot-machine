/* ==========================================================================
   3-Reel Classic Slot Machine — Game Logic
   ========================================================================== */

(function () {
  'use strict';

  // Symbols used on the reels, with relative weights (higher = more common)
  const SYMBOLS = [
    { icon: '🍒', weight: 30, payout: 2 },
    { icon: '🍋', weight: 25, payout: 3 },
    { icon: '🍊', weight: 20, payout: 4 },
    { icon: '🔔', weight: 12, payout: 8 },
    { icon: '💎', weight: 8, payout: 15 },
    { icon: '7️⃣', weight: 5, payout: 50 }
  ];

  const STARTING_CREDITS = 100;
  const MIN_BET = 5;
  const MAX_BET = 50;
  const BET_STEP = 5;
  const SPIN_DURATION_MS = 1200;
  const REEL_STAGGER_MS = 250;

  const state = {
    credits: STARTING_CREDITS,
    bet: MIN_BET,
    spinning: false
  };

  let reelEls = [];
  let symbolEls = [];
  let spinButton;
  let creditsValueEl;
  let betValueEl;
  let resultMessageEl;
  let betUpBtn;
  let betDownBtn;

  function weightedRandomSymbol() {
    const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const symbol of SYMBOLS) {
      if (roll < symbol.weight) {
        return symbol;
      }
      roll -= symbol.weight;
    }
    return SYMBOLS[0];
  }

  function updateCreditsDisplay() {
    if (creditsValueEl) {
      creditsValueEl.textContent = state.credits;
    }
  }

  function updateBetDisplay() {
    if (betValueEl) {
      betValueEl.textContent = state.bet;
    }
  }

  function setResultMessage(text, type) {
    if (!resultMessageEl) return;
    resultMessageEl.textContent = text;
    resultMessageEl.classList.remove('win', 'lose');
    if (type) {
      resultMessageEl.classList.add(type);
    }
  }

  function changeBet(amount) {
    if (state.spinning) return;
    const newBet = state.bet + amount;
    if (newBet < MIN_BET || newBet > MAX_BET) return;
    if (newBet > state.credits) return;
    state.bet = newBet;
    updateBetDisplay();
  }

  function evaluateResult(finalSymbols) {
    const [a, b, c] = finalSymbols;

    if (a.icon === b.icon && b.icon === c.icon) {
      const winnings = state.bet * a.payout;
      state.credits += winnings;
      setResultMessage(`🎉 Jackpot! ${a.icon}${a.icon}${a.icon} — You won ${winnings} credits!`, 'win');
      return;
    }

    if (a.icon === b.icon || b.icon === c.icon || a.icon === c.icon) {
      const winnings = Math.round(state.bet * 1.5);
      state.credits += winnings;
      setResultMessage(`Nice! Two matching symbols — You won ${winnings} credits!`, 'win');
      return;
    }

    setResultMessage('No match. Try again!', 'lose');
  }

  function spinReel(reelEl, symbolEl, duration) {
    return new Promise((resolve) => {
      reelEl.classList.add('spinning');

      const spinInterval = setInterval(() => {
        symbolEl.textContent = weightedRandomSymbol().icon;
      }, 80);

      setTimeout(() => {
        clearInterval(spinInterval);
        reelEl.classList.remove('spinning');
        const finalSymbol = weightedRandomSymbol();
        symbolEl.textContent = finalSymbol.icon;
        resolve(finalSymbol);
      }, duration);
    });
  }

  async function spin() {
    if (state.spinning) return;

    if (state.credits < state.bet) {
      setResultMessage('Not enough credits to spin!', 'lose');
      return;
    }

    state.spinning = true;
    spinButton.disabled = true;
    betUpBtn.disabled = true;
    betDownBtn.disabled = true;

    state.credits -= state.bet;
    updateCreditsDisplay();
    setResultMessage('Spinning...', null);

    const spinPromises = reelEls.map((reelEl, index) => {
      const duration = SPIN_DURATION_MS + index * REEL_STAGGER_MS;
      return spinReel(reelEl, symbolEls[index], duration);
    });

    const results = await Promise.all(spinPromises);

    updateCreditsDisplay();
    evaluateResult(results);
    updateCreditsDisplay();

    if (state.credits <= 0) {
      setTimeout(() => {
        setResultMessage('Out of credits! Refresh to play again.', 'lose');
      }, 500);
    }

    state.spinning = false;
    spinButton.disabled = false;
    betUpBtn.disabled = false;
    betDownBtn.disabled = false;
  }

  function init() {
    reelEls = [
      document.getElementById('reel1'),
      document.getElementById('reel2'),
      document.getElementById('reel3')
    ];

    symbolEls = reelEls.map((reelEl) => {
      const span = document.createElement('span');
      span.className = 'reel-symbol';
      span.textContent = SYMBOLS[0].icon;
      reelEl.innerHTML = '';
      reelEl.appendChild(span);
      return span;
    });

    spinButton = document.getElementById('spinButton');
    creditsValueEl = document.getElementById('creditsValue');
    betValueEl = document.getElementById('betValue');
    resultMessageEl = document.getElementById('resultMessage');
    betUpBtn = document.getElementById('betUp');
    betDownBtn = document.getElementById('betDown');

    updateCreditsDisplay();
    updateBetDisplay();
    setResultMessage('Place your bet and spin!', null);

    if (spinButton) {
      spinButton.addEventListener('click', spin);
    }
    if (betUpBtn) {
      betUpBtn.addEventListener('click', () => changeBet(BET_STEP));
    }
    if (betDownBtn) {
      betDownBtn.addEventListener('click', () => changeBet(-BET_STEP));
    }

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        spin();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
