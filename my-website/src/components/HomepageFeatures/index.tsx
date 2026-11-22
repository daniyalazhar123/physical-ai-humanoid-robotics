import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface FeatureItem {
  title: string;
  Svg?: React.ComponentType<React.ComponentProps<'svg'>>;
  icon?: string;
  description: React.ReactNode;
  link?: string;
  linkText?: string;
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Cutting-Edge Research',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: <>Explore the latest in AI, robotics, and humanoid engineering. We are at the forefront of research and development.</>,
    link: '/docs/my-book/chapter-1',
    linkText: 'Explore Research'
  },
  {
    title: 'Open Source Hardware',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: <>Our commitment to open source means you can access, modify, and contribute to our hardware designs.</>,
    link: '/docs/my-book/chapter-4',
    linkText: 'View Hardware'
  },
  {
    title: 'Community-Driven Collaboration',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: <>Join a vibrant community of engineers, researchers, and hobbyists. Share your ideas and collaborate.</>,
    link: '/docs/my-book/chapter-10',
    linkText: 'Join Community'
  },
  {
    title: 'Module 1: ROS 2 Fundamentals',
    icon: '🤖',
    description: <>Learn the basics of Robot Operating System 2, including nodes, topics, services, and actions.</>,
    link: '/docs/my-book/chapter-2',
    linkText: 'Start Learning'
  },
  {
    title: 'Module 2: Sensors and End Effectors',
    icon: '📡',
    description: <>Understanding different types of sensors and actuators used in robotics applications.</>,
    link: '/docs/my-book/chapter-3',
    linkText: 'Start Learning'
  },
  {
    title: 'Module 3: Vision-Language-Action (VLA) Systems',
    icon: '👁️',
    description: <>Integration of computer vision, natural language processing, and action for intelligent robotics.</>,
    link: '/docs/my-book/chapter-5',
    linkText: 'Start Learning'
  },
  {
    title: 'Module 4: Humanoid Robot Development',
    icon: '🦾',
    description: <>Mechanical design, control systems, and development of humanoid robots.</>,
    link: '/docs/my-book/chapter-6',
    linkText: 'Start Learning'
  },
  {
    title: 'Module 5: Conversational Robotics',
    icon: '💬',
    description: <>Speech recognition, natural language understanding, and human-robot interaction.</>,
    link: '/docs/my-book/chapter-7',
    linkText: 'Start Learning'
  },
  {
    title: 'Module 6: Advanced Robotics Concepts',
    icon: '⚙️',
    description: <>Advanced topics in robotics including perception-action loops and real-time requirements.</>,
    link: '/docs/my-book/chapter-8',
    linkText: 'Start Learning'
  },
];

interface FeatureProps {
  Svg?: React.ComponentType<React.ComponentProps<'svg'>>;
  title: string;
  description: React.ReactNode;
  link?: string;
  linkText?: string;
  icon?: string;
}

function Feature({ Svg, title, description, link, linkText, icon }: FeatureProps) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        {Svg ? (
          <Svg className={styles.featureSvg} role="img" />
        ) : (
          <div className={styles.featureIcon}>{icon}</div>
        )}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        {link && linkText && (
          <div className="text--center padding-vert--md">
            <Link className="button button--secondary button--md" to={link}>
              {linkText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomepageFeatures(): React.ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row padding-bottom--lg">
          {FeatureList.slice(0, 3).map(({ title, Svg, description, link, linkText }) => (
            <Feature key={title} title={title} Svg={Svg} description={description} link={link} linkText={linkText} />
          ))}
        </div>
        <div className="row padding-bottom--lg">
          {FeatureList.slice(3, 6).map(({ title, icon, description, link, linkText }) => (
            <Feature key={title} title={title} icon={icon} description={description} link={link} linkText={linkText} />
          ))}
        </div>
        <div className="row">
          {FeatureList.slice(6, 9).map(({ title, icon, description, link, linkText }) => (
            <Feature key={title} title={title} icon={icon} description={description} link={link} linkText={linkText} />
          ))}
        </div>
      </div>
    </section>
  );
}
