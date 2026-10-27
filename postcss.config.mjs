import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss(),
    autoprefixer({
      overrideBrowserslist: ['and_chr >= 80', 'iOS >= 13.4', 'Chrome >= 80', 'Safari >= 13.1'],
    }),
  ],
};
