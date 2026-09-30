class Theme {
	dark = $state(true);

	constructor() {
		if (typeof document !== 'undefined') this.dark = document.documentElement.classList.contains('dark');
	}

	toggle() {
		this.dark = !this.dark;
		document.documentElement.classList.toggle('dark', this.dark);
		try {
			localStorage.setItem('dtf-theme', this.dark ? 'dark' : 'light');
		} catch {
			// ignore
		}
	}
}

export const theme = new Theme();
