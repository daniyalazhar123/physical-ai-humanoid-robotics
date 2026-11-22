import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './modules.module.css';

const MODULES = [
  {
    title: 'Chapter 1: Introduction to Physical & Embodied AI',
    desc: 'Foundational concepts of Physical AI vs Embodied AI, historical context, the convergence of AI and physical systems, and why humanoid robotics NOW.',
    tags: ['Physical AI', 'Embodied AI', 'History', 'Foundation Models'],
    link: '/docs/my-book/chapter-1',
    icon: '🧠',
  },
  {
    title: 'Chapter 2: ROS 2 & Robot Software Architecture',
    desc: 'Robot Operating System 2 — nodes, topics, services, actions, QoS, real-time control, distributed architecture for humanoid systems.',
    tags: ['ROS 2', 'Nodes', 'Topics', 'Services', 'Real-time'],
    link: '/docs/my-book/chapter-2',
    icon: '⚙️',
  },
  {
    title: 'Chapter 3: Simulation and Modeling',
    desc: 'Gazebo, URDF/SDF modeling, physics engines (ODE, Bullet, DART), sensor simulation, ros_gz_bridge, and digital twins.',
    tags: ['Simulation', 'Gazebo', 'URDF', 'Physics', 'Digital Twins'],
    link: '/docs/my-book/chapter-3',
    icon: '🌍',
  },
  {
    title: 'Chapter 4: Computer Vision',
    desc: 'Camera models, calibration, feature detection, depth estimation, visual SLAM, object detection, and multi-modal perception.',
    tags: ['Vision', 'SLAM', 'Depth', 'Detection', 'Perception'],
    link: '/docs/my-book/chapter-4',
    icon: '👁️',
  },
  {
    title: 'Chapter 5: Vision-Language-Action (VLA) Systems',
    desc: 'RT-2, Pi-Zero, OpenVLA, Octo — end-to-end robot learning with transformers, flow matching, and sim-to-real transfer.',
    tags: ['VLA', 'RT-2', 'Pi-Zero', 'Transformers', 'Flow Matching'],
    link: '/docs/my-book/chapter-5',
    icon: '🤖',
  },
  {
    title: 'Chapter 6: Humanoid Development',
    desc: 'Mechanical design, bipedal locomotion, whole-body control, force control, and hardware platforms (Tesla Optimus, Figure AI, Atlas).',
    tags: ['Humanoid', 'Locomotion', 'Control', 'Hardware'],
    link: '/docs/my-book/chapter-6',
    icon: '🦾',
  },
  {
    title: 'Chapter 7: Conversational Robotics',
    desc: 'Speech recognition, TTS, NLP, dialogue management, multi-modal interaction, and social robotics for human-robot communication.',
    tags: ['Speech', 'NLP', 'Dialogue', 'Interaction', 'Social'],
    link: '/docs/my-book/chapter-7',
    icon: '💬',
  },
  {
    title: 'Chapter 8: Advanced Concepts',
    desc: 'Perception-action loops, real-time systems, safety-critical control, ethical AI, and deployment in unstructured environments.',
    tags: ['Real-time', 'Safety', 'Ethics', 'Deployment'],
    link: '/docs/my-book/chapter-8',
    icon: '⚡',
  },
  {
    title: 'Chapter 9: Advanced Topics',
    desc: 'Multi-agent systems, swarm robotics, cloud robotics, edge computing, and federated learning for distributed robot intelligence.',
    tags: ['Multi-agent', 'Swarm', 'Cloud', 'Edge', 'Federated'],
    link: '/docs/my-book/chapter-9',
    icon: '☁️',
  },
  {
    title: 'Chapter 10: Future Directions',
    desc: 'Open challenges, emerging trends, AGI in robotics, brain-computer interfaces, and the roadmap to general-purpose humanoids.',
    tags: ['Future', 'AGI', 'BCI', 'Trends', 'Roadmap'],
    link: '/docs/my-book/chapter-10',
    icon: '🚀',
  },
];

function ModulesPage(): React.ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Modules - ${siteConfig.title}`}
      description="All chapters of the AI Physical Humanoids Robotics Engineering textbook">
      <main className={styles.modulesContainer}>
        <div className="container container--fluid padding-horiz--xl padding-vert--lg">
          <div className="row">
            <div className="col col--12 padding-vert--lg">
              <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
                Textbook Modules
              </Heading>
              <p className="hero__subtitle">
                All 10 chapters of the AI Physical Humanoids Robotics Engineering curriculum
              </p>

              <div className={styles.modulesGrid}>
                {MODULES.map((mod) => (
                  <div key={mod.title} className={styles.moduleCard}>
                    <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>{mod.icon}</div>
                    <h3>{mod.title}</h3>
                    <p>{mod.desc}</p>
                    <div className={styles.moduleTopics}>
                      {mod.tags.map((tag) => (
                        <span key={tag} className={styles.topicTag}>{tag}</span>
                      ))}
                    </div>
                    <Link to={mod.link} className={styles.moduleLink}>
                      Read Chapter
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

export default ModulesPage;
