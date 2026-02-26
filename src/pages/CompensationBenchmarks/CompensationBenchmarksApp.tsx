import { useState, useCallback } from 'react';
import { BenchmarksOverview } from './BenchmarksOverview';
import { JobDetail } from './JobDetail';
import { AddBenchmarkModal } from './AddBenchmarkModal';
import { Icon } from '../../components/Icon';
import { type Job, type Benchmark } from '../../data/compensationData';
import './CompensationBenchmarks.css';

type Screen = 'overview' | 'detail';

interface ToastData {
  message: string;
  visible: boolean;
  exiting: boolean;
}

export function CompensationBenchmarksApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('overview');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [newBenchmark, setNewBenchmark] = useState<Benchmark | null>(null);

  const handleSelectJob = useCallback((job: Job) => {
    setSelectedJob(job);
    setNewBenchmark(null);
    setCurrentScreen('detail');
  }, []);

  const handleBack = useCallback(() => {
    setCurrentScreen('overview');
    setSelectedJob(null);
    setNewBenchmark(null);
  }, []);

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleSaveBenchmark = useCallback((benchmark: Benchmark) => {
    setNewBenchmark(benchmark);
    setShowModal(false);

    // Show toast
    const matchTitle = benchmark.matchedTitle;
    const level = benchmark.values.length > 0 ? '' : '';
    setToast({
      message: `Benchmark saved — ${matchTitle} applied to ${selectedJob?.title}`,
      visible: true,
      exiting: false,
    });

    // Auto-dismiss toast
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, exiting: true } : null);
      setTimeout(() => {
        setToast(null);
      }, 300);
    }, 4500);
  }, [selectedJob]);

  return (
    <>
      {currentScreen === 'overview' && (
        <BenchmarksOverview onSelectJob={handleSelectJob} />
      )}

      {currentScreen === 'detail' && selectedJob && (
        <JobDetail
          job={selectedJob}
          onBack={handleBack}
          onAddBenchmark={handleOpenModal}
          newBenchmark={newBenchmark}
        />
      )}

      {showModal && selectedJob && (
        <AddBenchmarkModal
          job={selectedJob}
          onClose={handleCloseModal}
          onSave={handleSaveBenchmark}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`comp-toast ${toast.exiting ? 'comp-toast-exit' : ''}`}>
          <Icon name="check-circle" size={16} style={{ color: 'white' }} />
          {toast.message}
        </div>
      )}
    </>
  );
}
