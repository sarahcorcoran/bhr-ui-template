import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { Home, MyInfo, People, Hiring, Reports, Files, Payroll, Settings, Inbox, NewEmployeePage, DatePickerDemo, CreateJobOpening, JobAIPrototype } from './pages';
import { JobOpeningDetail } from './pages/JobOpeningDetail';
import { Chat } from './pages/Chat';
import { ChatTransitionsDemo } from './pages/ChatTransitionsDemo';
import { TextReflowDemo } from './pages/TextReflowDemo';
import { TextReflowDemo2 } from './pages/TextReflowDemo2';
import { CompensationBenchmarksApp } from './pages/CompensationBenchmarks';
import { DemoDashboard, DemoTimeOffReport, DemoReportBuilder, OmniExplorePage } from './pages/Demo';
import { AskBambooHR } from './AskBambooHR';
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
            {/* AskBambooHR prototype - Full page, no AppLayout */}
            <Route path="/ask" element={<AskBambooHR />} />

            {/* Chat routes - Full page, no AppLayout */}
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:conversationId" element={<Chat />} />

            {/* inactive - not yet designed */}
            {/* <Route path="/chat-transitions-demo" element={<ChatTransitionsDemo />} /> */}
            {/* inactive - not yet designed */}
            {/* <Route path="/text-reflow-demo" element={<TextReflowDemo />} /> */}
            {/* inactive - not yet designed */}
            {/* <Route path="/text-reflow-demo-2" element={<TextReflowDemo2 />} /> */}
            {/* inactive - not yet designed */}
            {/* <Route path="/datepicker-demo" element={<DatePickerDemo />} /> */}
            {/* inactive - not yet designed */}
            {/* <Route path="/job-ai-prototype" element={<JobAIPrototype />} /> */}

            {/* Regular routes with AppLayout */}
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<HomeOrDemo />} />
                    {/* inactive - not yet designed */}
                    {/* <Route path="/my-info" element={<MyInfo />} /> */}
                    {/* inactive - not yet designed */}
                    {/* <Route path="/people" element={<People />} /> */}
                    {/* inactive - not yet designed */}
                    {/* <Route path="/people/new" element={<NewEmployeePage />} /> */}
                    {/* inactive - not yet designed */}
                    {/* <Route path="/hiring" element={<Hiring />} /> */}
                    {/* inactive - not yet designed */}
                    {/* <Route path="/hiring/job/:id" element={<JobOpeningDetail />} /> */}
                    {/* inactive - not yet designed */}
                    {/* <Route path="/hiring/new" element={<CreateJobOpening />} /> */}
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/reports/time-off" element={<DemoTimeOffReport />} />
                    <Route path="/reports/builder" element={<DemoReportBuilder />} />
                    {/* inactive - not yet designed */}
                    {/* <Route path="/files" element={<Files />} /> */}
                    {/* inactive - not yet designed */}
                    {/* <Route path="/payroll" element={<Payroll />} /> */}
                    {/* inactive - not yet designed */}
                    {/* <Route path="/inbox" element={<Inbox />} /> */}
                    {/* inactive - not yet designed */}
                    {/* <Route path="/settings" element={<Settings />} /> */}
                    {/* inactive - not yet designed */}
                    {/* <Route path="/compensation" element={<CompensationBenchmarksApp />} /> */}
                    <Route path="/demo" element={<DemoDashboard />} />
                    <Route path="/omni-explore" element={<OmniExplorePage />} />
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
