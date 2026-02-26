import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { Home, MyInfo, People, Hiring, Reports, Files, Payroll, Settings, Inbox, NewEmployeePage, DatePickerDemo, CreateJobOpening, JobAIPrototype } from './pages';
import { JobOpeningDetail } from './pages/JobOpeningDetail';
import { Chat } from './pages/Chat';
import { ChatTransitionsDemo } from './pages/ChatTransitionsDemo';
import { TextReflowDemo } from './pages/TextReflowDemo';
import { TextReflowDemo2 } from './pages/TextReflowDemo2';
import { CompensationBenchmarksApp } from './pages/CompensationBenchmarks';
import { DemoDashboard, DemoTimeOffReport, DemoReportBuilder } from './pages/Demo';
import { ChatProvider } from './contexts/ChatContext';
import { DemoProvider } from './contexts/DemoContext';

/** Redirect /?demo=true to /demo, otherwise show Home */
function HomeOrDemo() {
  const [searchParams] = useSearchParams();
  if (searchParams.get('demo') === 'true') {
    return <Navigate to="/chat?demo=true" replace />;
  }
  return <Home />;
}

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <DemoProvider>
          <Routes>
            {/* Chat routes - Full page, no AppLayout */}
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:conversationId" element={<Chat />} />

            {/* Demo routes for testing transitions */}
            <Route path="/chat-transitions-demo" element={<ChatTransitionsDemo />} />
            <Route path="/text-reflow-demo" element={<TextReflowDemo />} />
            <Route path="/text-reflow-demo-2" element={<TextReflowDemo2 />} />
            <Route path="/datepicker-demo" element={<DatePickerDemo />} />
            <Route path="/job-ai-prototype" element={<JobAIPrototype />} />

            {/* Regular routes with AppLayout */}
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<HomeOrDemo />} />
                    <Route path="/my-info" element={<MyInfo />} />
                    <Route path="/people" element={<People />} />
                    <Route path="/people/new" element={<NewEmployeePage />} />
                    <Route path="/hiring" element={<Hiring />} />
                    <Route path="/hiring/job/:id" element={<JobOpeningDetail />} />
                    <Route path="/hiring/new" element={<CreateJobOpening />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/reports/time-off" element={<DemoTimeOffReport />} />
                    <Route path="/reports/builder" element={<DemoReportBuilder />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/payroll" element={<Payroll />} />
                    <Route path="/inbox" element={<Inbox />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/compensation" element={<CompensationBenchmarksApp />} />
                    <Route path="/demo" element={<DemoDashboard />} />
                  </Routes>
                </AppLayout>
              }
            />
          </Routes>
        </DemoProvider>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
