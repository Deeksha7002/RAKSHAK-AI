class SoundManager {
    private context: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isMuted: boolean = false;

    constructor() {
        // Initialize context lazily on first interaction
    }

    private init() {
        if (!this.context) {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = 0.3; // Default volume
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    public playNotification() {
        this.init();
        if (!this.context || !this.masterGain || this.isMuted) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Standard "Ding" - Clean Sine
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.context.currentTime); // Steady high pitch

        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5); // Longer decay

        osc.start();
        osc.stop(this.context.currentTime + 0.5);
    }

    public playAlert() {
        this.init();
        if (!this.context || !this.masterGain || this.isMuted) return;

        const now = this.context.currentTime;

        // "Heartbeat" double thud
        [0, 0.15].forEach(offset => {
            const osc = this.context!.createOscillator();
            const gain = this.context!.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.type = 'triangle'; // Low triangle for body
            osc.frequency.setValueAtTime(80, now + offset);
            osc.frequency.linearRampToValueAtTime(40, now + offset + 0.1);

            gain.gain.setValueAtTime(0, now + offset);
            gain.gain.linearRampToValueAtTime(0.6, now + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.2);

            osc.start(now + offset);
            osc.stop(now + offset + 0.2);
        });
    }

    public playSuccess() {
        this.init();
        if (!this.context || !this.masterGain || this.isMuted) return;

        // "Swish" - Filtered Noise for a premium feel
        // Using Oscillator fallback since NoiseBuffer is complex to generate procedurally clean
        // We'll use a very soft, fast sine sweep "Chime"

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.2);

        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.3);

        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    }

    public playTyping() {
        this.init();
        if (!this.context || !this.masterGain || this.isMuted) return;

        // "Tick" - filtered noise simulation using high freq sine burst
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, this.context.currentTime);

        // Randomize pitch to prevent machine-gun effect
        osc.frequency.value += (Math.random() * 500 - 250);

        gain.gain.setValueAtTime(0.05, this.context.currentTime); // Whisper quiet
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.03);

        osc.start();
        osc.stop(this.context.currentTime + 0.03);
    }

    public playLockerOpen() {
        this.init();
        if (!this.context || !this.masterGain || this.isMuted) return;

        // "Slide" sound
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(300, this.context.currentTime + 0.2);

        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);

        osc.start();
        osc.stop(this.context.currentTime + 0.2);
    }

    public playClick() {
        this.init();
        if (!this.context || !this.masterGain || this.isMuted) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, this.context.currentTime); // High sharp click
        osc.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.01);

        gain.gain.setValueAtTime(0.08, this.context.currentTime); // Subtle
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.05);

        osc.start();
        osc.stop(this.context.currentTime + 0.05);
    }

    public playScanError() {
        this.init();
        if (!this.context || !this.masterGain || this.isMuted) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);

        osc.start();
        osc.stop(now + 0.3);
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

export const soundManager = new SoundManager();
