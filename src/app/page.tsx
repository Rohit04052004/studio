import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, User, Bot, History, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Welcome back, rohit chigatapu!
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
          Your AI-powered medical assistant for understanding lab reports, medical scans, and getting personalized health insights. Upload your reports and start conversations with our intelligent system.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Reports Analyzed
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Aug 30</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Get answers to your health questions using advanced RAG technology.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow" />
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/assistant">
                Get Started <ArrowRight />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText />
              Report Analysis
            </CardTitle>
            <CardDescription>
              Upload and analyze your medical reports with AI interpretation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow" />
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/reports">
                Get Started <ArrowRight />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History />
              History
            </CardTitle>
            <CardDescription>
              View all your past reports and consultations in one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow" />
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/history">
                Get Started <ArrowRight />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck />
            About MedReport Interpreter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-lg">What We Do</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Analyze laboratory text reports and medical images</li>
                <li>Provide clear, plain-language summaries of findings</li>
                <li>Highlight abnormal or significant results</li>
                <li>Explain complex medical terminology</li>
                <li>Answer health-related questions using RAG technology</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-lg">Privacy & Safety</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Your data is encrypted and secure</li>
                <li>Reports are processed confidentially</li>
                <li>No data is shared with third parties</li>
                <li>Always consult healthcare professionals</li>
                <li>This tool supplements, not replaces, medical advice</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-yellow-950/30 border-yellow-200/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-200">Medical Disclaimer</h3>
                <p className="text-sm text-yellow-200/80 mt-1">
                  This tool is for educational and informational purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
