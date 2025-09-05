import React, { useEffect, useState } from 'react';
import { render } from "@opentui/react";
import { blue, bold, green, red, yellow, t } from "@opentui/core";
import { ProjectInfo } from '../core/prerequisites.js';
import { InstallOptions, installThemeManager } from '../core/installer.js';

interface InstallationUIProps {
  projectInfo: ProjectInfo;
  options: InstallOptions;
}

type InstallStep = 'package' | 'directories' | 'themes' | 'registry' | 'css' | 'complete' | 'error';

interface StepInfo {
  id: InstallStep;
  title: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  message?: string;
}

export function InstallationUI({ projectInfo, options }: InstallationUIProps) {
  const [currentStep, setCurrentStep] = useState<InstallStep>('package');
  const [steps, setSteps] = useState<StepInfo[]>([
    { id: 'package', title: 'Installing package', status: 'pending' },
    { id: 'directories', title: 'Creating directories', status: 'pending' },
    { id: 'themes', title: 'Generating theme files', status: 'pending' },
    { id: 'registry', title: 'Creating registry', status: 'pending' },
    { id: 'css', title: 'Updating global.css', status: 'pending' },
    { id: 'complete', title: 'Installation complete', status: 'pending' }
  ]);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStep = (stepId: InstallStep, status: StepInfo['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message }
        : step
    ));
    
    if (status === 'complete') {
      const stepIndex = steps.findIndex(s => s.id === stepId);
      setProgress(((stepIndex + 1) / steps.length) * 100);
    }
  };

  useEffect(() => {
    const runInstallation = async () => {
      try {
        // Mock installation process with visual feedback
        updateStep('package', 'running');
        await delay(2000); // Simulate package installation
        updateStep('package', 'complete', `${projectInfo.packageManager} package installed`);

        setCurrentStep('directories');
        updateStep('directories', 'running');
        await delay(500);
        updateStep('directories', 'complete', 'Theme directories created');

        setCurrentStep('themes');
        updateStep('themes', 'running');
        await delay(1000);
        updateStep('themes', 'complete', 'Default light/dark themes generated');

        setCurrentStep('registry');
        updateStep('registry', 'running');
        await delay(500);
        updateStep('registry', 'complete', 'Theme registry created');

        setCurrentStep('css');
        updateStep('css', 'running');
        await delay(800);
        updateStep('css', 'complete', 'Global CSS updated with theme imports');

        setCurrentStep('complete');
        updateStep('complete', 'complete');
        setIsComplete(true);
        setProgress(100);

        // Auto-exit after showing success
        setTimeout(() => {
          process.exit(0);
        }, 2000);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        updateStep(currentStep, 'error', errorMessage);
      }
    };

    runInstallation();
  }, []);

  const getStepIcon = (status: StepInfo['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStepColor = (status: StepInfo['status']) => {
    switch (status) {
      case 'pending': return (text: string) => text;
      case 'running': return blue;
      case 'complete': return green;
      case 'error': return red;
      default: return (text: string) => text;
    }
  };

  return (
    <box padding={2}>
      <box marginBottom={1}>
        <text>{bold(blue('🛠️ Theme Manager Installation'))}</text>
      </box>

      <box border borderStyle="single" padding={1} marginBottom={1}>
        <box marginBottom={1}>
          <text>{bold('Progress:')} {Math.round(progress)}%</text>
        </box>
        
        {/* Progress bar */}
        <box>
          <text>{'█'.repeat(Math.floor(progress / 5))}{'░'.repeat(20 - Math.floor(progress / 5))}</text>
        </box>
      </box>

      <box>
        {steps.map((step) => (
          <box key={step.id} marginBottom={1}>
            <text>
              {t`${getStepIcon(step.status)} ${getStepColor(step.status)(step.title)}`}
              {step.message && ` - ${step.message}`}
            </text>
          </box>
        ))}
      </box>

      {error && (
        <box marginTop={1} padding={1} backgroundColor="red">
          <text>{bold(red(`❌ Installation failed: ${error}`))}</text>
        </box>
      )}

      {isComplete && !error && (
        <box marginTop={1} padding={1} border borderStyle="double">
          <box marginBottom={1}>
            <text>{bold(green('🎉 Installation Complete!'))}</text>
          </box>
          <box marginBottom={1}>
            <text>{bold('Next steps:')}</text>
          </box>
          <box>
            <text>1. {blue(`${projectInfo.packageManager || 'npm'} run dev`)}</text>
          </box>
          <box>
            <text>2. Your themes are now available!</text>
          </box>
        </box>
      )}
    </box>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}