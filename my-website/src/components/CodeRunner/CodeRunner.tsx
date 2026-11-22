import React, { useState } from 'react';
import styles from './CodeRunner.module.css';

interface CodeRunnerProps {
  code: string;
  language?: string;
  title?: string;
}

export default function CodeRunner({ code, language = 'python', title = 'Code Example' }: CodeRunnerProps) {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...\n');

    setTimeout(() => {
      let simulatedOutput = '';

      if (language.toLowerCase().includes('python')) {
        if (code.includes('whisper') || code.includes('Whisper')) {
          simulatedOutput = `Loading Whisper model...\nTranscribing audio...\nRecognized: "Go forward and pick up the red cup"\nCommand mapped to action: move_forward\nAction executed successfully!`;
        } else if (code.includes('VLA') || code.includes('vla') || code.includes('VLAPipeline')) {
          simulatedOutput = `Initializing VLA Pipeline...\nProcessing visual input...\nProcessing linguistic input: "Bring me the coffee mug"\nFusing multi-modal information...\nGenerating action: navigate_to_object -> grasp_object\nAction sequence completed successfully!`;
        } else if (code.includes('Task') || code.includes('task')) {
          simulatedOutput = `Initializing cognitive planning...\nDecomposing task: "Go to kitchen and bring red cup"\nSubtasks generated:\n1. Navigate to kitchen\n2. Identify red cup\n3. Grasp red cup\n4. Return to starting position\nTask decomposition completed!`;
        } else {
          simulatedOutput = `Executing ${language} code...\nCode executed successfully!\nProcess completed with exit code 0`;
        }
      } else {
        simulatedOutput = `Executing ${language} code...\nCode executed successfully!`;
      }

      setOutput(simulatedOutput);
      setIsRunning(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className={styles.codeRunner}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.controls}>
          <button onClick={runCode} disabled={isRunning} className={styles.runButton}>
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button onClick={copyToClipboard} className={styles.copyButton}>
            Copy
          </button>
        </div>
      </div>
      <pre className={styles.codeBlock}>
        <code>{code}</code>
      </pre>
      {output && (
        <div className={styles.outputContainer}>
          <div className={styles.outputHeader}>
            <span>Output</span>
          </div>
          <pre className={styles.output}>
            <code>{output}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
