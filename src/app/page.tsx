
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Bot, History, ShieldCheck, ArrowRight, Server, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { checkDbConnectionAction } from './actions';


export default async function LandingPage() {
  const { connected } = await checkDbConnectionAction();

  return (
    <div className="flex flex-col gap-12">
      <section className="text-center">

        <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center">
                    <Server className="h-6 w-6" />
                    Connection Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                {connected ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle2 />
                        <p className="font-semibold">Successfully connected to Firebase!</p>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 text-red-400">
                        <AlertCircle />
                        <p className="font-semibold">Failed to connect to Firebase.</p>
                    </div>
                )}
                 <p className="text-xs text-muted-foreground mt-2">This tests the server's connection to Firestore.</p>
            </CardContent>
        </Card>


        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
          Understand Your Health, Simplified.
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-muted-foreground mb-8">
          MedReport is an AI-powered medical assistant that helps you make sense of complex lab reports and medical scans. Get clear summaries, ask questions, and take control of your health journey.
        </p>
        <Button size="lg" asChild>
          <Link href="/signup">
            Get Started Now <ArrowRight className="ml-2" />
          </Link>
        </Button>
         <p className="text-sm mt-4 text-muted-foreground">Already have an account? <Link href="/login" className="underline hover:text-primary">Sign In</Link></p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText />
              Report Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Upload text-based lab results or medical images. Our AI provides plain-language summaries, highlights abnormal findings, and explains complex medical terms.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot />
              AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Ask follow-up questions about your report or inquire about general health topics. Our conversational AI provides evidence-based, easy-to-understand answers.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History />
              Secure History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              All your reports and conversations are stored securely. Access your health information anytime, anywhere, and track your history in one place.
            </p>
          </CardContent>
        </Card>
      </section>
      
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck />
            Your Privacy is Our Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
             We are committed to protecting your sensitive health information. Your data is encrypted, stored securely, and is never shared with third parties. MedReport is a tool to supplement, not replace, the guidance of your healthcare provider. Always consult a medical professional for diagnosis and treatment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
