// @ts-check

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'AI Physical Humanoids Robotics Engineering',
  tagline: 'A comprehensive textbook on AI Systems in the Physical World',
  favicon: 'img/favicon.ico',

  url: 'https://physical-ai-textbook.vercel.app',
  baseUrl: '/',

  organizationName: 'physical-ai',
  projectName: 'physical-ai-humanoid-robotics',

  onBrokenLinks: 'warn',

  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Noto+Nastaliq+Urdu:wght@400;500;700&display=swap',
      type: 'text/css',
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur'],
    localeConfigs: {
      en: {
        label: 'English',
        direction: 'ltr',
      },
      ur: {
        label: 'اردو',
        direction: 'rtl',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          remarkPlugins: [require('mdx-mermaid')],
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],
  plugins: [],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'AI Physical Humanoids Robotics Engineering',
        logo: {
          alt: 'AI Physical Humanoids Robotics Engineering Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Courses',
          },
          {to: '/modules', label: 'Modules', position: 'left'},
          {to: '/new-developments', label: 'New Developments', position: 'left'},
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/BasenAI',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Courses',
            items: [
              {label: 'Introduction', to: '/docs/intro'},
              {label: 'Chapter 1: Introduction to Physical AI', to: '/docs/my-book/chapter-1'},
              {label: 'Chapter 2: ROS 2', to: '/docs/my-book/chapter-2'},
              {label: 'Chapter 3: Simulation and Modeling', to: '/docs/my-book/chapter-3'},
              {label: 'Chapter 4: Computer Vision', to: '/docs/my-book/chapter-4'},
              {label: 'Chapter 5: VLA Systems', to: '/docs/my-book/chapter-5'},
            ],
          },
          {
            title: 'Advanced',
            items: [
              {label: 'Chapter 6: Humanoid Development', to: '/docs/my-book/chapter-6'},
              {label: 'Chapter 7: Conversational Robotics', to: '/docs/my-book/chapter-7'},
              {label: 'Chapter 8: Advanced Concepts', to: '/docs/my-book/chapter-8'},
              {label: 'Chapter 9: Advanced Topics', to: '/docs/my-book/chapter-9'},
              {label: 'Chapter 10: Future Directions', to: '/docs/my-book/chapter-10'},
            ],
          },
          {
            title: 'Resources',
            items: [
              {label: 'GitHub Repo', href: 'https://github.com/BasenAI'},
              {label: 'All Modules', to: '/modules'},
              {label: 'New Developments', to: '/new-developments'},
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Physical AI Textbook. All rights reserved.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
