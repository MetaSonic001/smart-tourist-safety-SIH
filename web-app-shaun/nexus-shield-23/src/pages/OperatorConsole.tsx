import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Phone, PhoneCall, Clock, AlertTriangle, CheckCircle, Mic, MicOff, Volume2, FileAudio, Send, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockDataService } from '@/services/mockDataService';
import { useApiFallback } from '@/hooks/useApiFallback';
import { offlineQueue } from '@/services/offlineQueue';
import { toast } from '@/hooks/use-toast';

interface OperatorCall {
  id: string;
  incidentId: string;
  callerId: string;
  callerLocation: string;
  callType: string;
  priority: 'low' | 'medium' | 'high';
  status: 'incoming' | 'active' | 'completed';
  startTime: string;
  endTime?: string;
  duration?: number;
  operatorId: string;
  operatorName: string;
  summary: string;
  actions: string[];
  audioRecording?: string;
  transcription?: string;
  languageDetected?: string;
  outcome?: string;
}

export const OperatorConsole = () => {
  const { t } = useI18n();
  const [calls, setCalls] = useState<OperatorCall[]>([]);
  const [activeCall, setActiveCall] = useState<OperatorCall | null>(null);
  const [incomingCalls, setIncomingCalls] = useState<OperatorCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);

  const { data, error, loading: apiLoading } = useApiFallback<OperatorCall[]>('/api/operator-calls', '/mocks/operator-calls.json');
  useEffect(() => {
    if (data) {
      setCalls(data);
      const incoming = data.filter(call => call.status === 'incoming' || Math.random() > 0.7);
      setIncomingCalls(incoming.slice(0, 2));
    }
    setLoading(apiLoading);
    if (error) {
      toast({
        title: t('Error'),
        description: t('Failed to load operator console data'),
        variant: 'destructive',
      });
    }
    // Simulate new incoming calls
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const mockCall: OperatorCall = {
          id: `call-${Date.now()}`,
          incidentId: `INC-${Date.now()}`,
          callerId: `caller-${Math.random().toString(36).substr(2, 9)}`,
          callerLocation: ['Red Fort', 'India Gate', 'Connaught Place', 'Chandni Chowk'][Math.floor(Math.random() * 4)],
          callType: ['Emergency', 'Harassment', 'Theft', 'Medical'][Math.floor(Math.random() * 4)],
          priority: ['high', 'medium'][Math.floor(Math.random() * 2)] as 'high' | 'medium',
          status: 'incoming',
          startTime: new Date().toISOString(),
          operatorId: 'operator-1',
          operatorName: 'Emergency Operator Priya Sharma',
          summary: 'New incoming emergency call',
          actions: []
        };
        setIncomingCalls(prev => [mockCall, ...prev.slice(0, 2)]);
        toast({
          title: t('Incoming Emergency Call'),
          description: t(`${mockCall.callType} reported at ${mockCall.callerLocation}`),
        });
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [data, error, apiLoading, t, toast]);

  const handleAcceptCall = (call: OperatorCall) => {
    setActiveCall({ ...call, status: 'active' });
    setIncomingCalls(prev => prev.filter(c => c.id !== call.id));
    setShowCallModal(true);
    setCallNotes('');
    if (!navigator.onLine) {
      offlineQueue.enqueue({ type: 'ACCEPT_CALL', payload: { callId: call.id } });
    } else {
      // TODO: POST to API if online
    }
    toast({
      title: t('Call Accepted'),
      description: t(`Connected to ${call.callType} call from ${call.callerLocation}`),
    });
  };

  const handleDeclineCall = (callId: string) => {
    setIncomingCalls(prev => prev.filter(c => c.id !== callId));
    if (!navigator.onLine) {
      offlineQueue.enqueue({ type: 'DECLINE_CALL', payload: { callId } });
    } else {
      // TODO: POST to API if online
    }
    toast({
      title: t('Call Declined'),
      description: t('Call has been declined and forwarded'),
    });
  };

  const handleEndCall = () => {
    if (activeCall) {
      const completedCall = {
        ...activeCall,
        status: 'completed' as const,
        endTime: new Date().toISOString(),
        duration: Math.floor((Date.now() - new Date(activeCall.startTime).getTime()) / 1000),
        summary: callNotes || activeCall.summary,
        outcome: 'Call completed successfully'
      };
      
      setCalls(prev => [...prev, completedCall]);
      setActiveCall(null);
      setShowCallModal(false);
      setIsRecording(false);
      
      toast({
    title: t('Call Completed'),
    description: t('Call has been logged and incident updated'),
      });
    }
  };

  const handleDispatchUnit = () => {
    if (activeCall) {
      toast({
    title: t('Unit Dispatched'),
    description: t(`Emergency response unit dispatched to ${activeCall.callerLocation}`),
      });
    }
  };

  const handleStartRecording = () => {
    setIsRecording(!isRecording);
    toast({
  title: isRecording ? t('Recording Stopped') : t('Recording Started'),
  description: isRecording ? t('Audio recording saved') : t('Audio recording in progress'),
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-emergency';
      case 'medium': return 'text-warning';
      case 'low': return 'text-info';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'secondary' as const;
      case 'low': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" aria-busy="true" aria-live="polite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" aria-label={t('Loading')} />
          <p className="text-muted-foreground">{t('Loading operator console...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">112 Emergency Console</h1>
          <p className="text-muted-foreground">{t('Emergency call management and dispatch center')}</p>
        </div>
        <div className="flex gap-3">
          <Badge variant={activeCall ? "destructive" : "secondary"} className="px-3 py-1">
            {activeCall ? t('On Call') : t('Available')}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-sm text-muted-foreground">{t('Total Calls')}</p>
                <p className="text-2xl font-bold">{calls.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-emergency" />
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-sm text-muted-foreground">{t('High Priority')}</p>
                <p className="text-2xl font-bold">
                  {calls.filter(call => call.priority === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-sm text-muted-foreground">{t('Completed')}</p>
                <p className="text-2xl font-bold">
                  {calls.filter(call => call.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-info" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-sm text-muted-foreground">{t('Avg Duration')}</p>
                <p className="text-2xl font-bold">
                  {Math.round(calls.filter(c => c.duration).reduce((acc, c) => acc + (c.duration || 0), 0) / calls.filter(c => c.duration).length || 0)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incoming Calls */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-emergency animate-pulse" />
                {t('Incoming Calls')} ({incomingCalls.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {incomingCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No incoming calls</p>
                  <p>{t('No incoming calls')}</p>
                </div>
              ) : (
                incomingCalls.map((call) => (
                  <div key={call.id} className="p-4 border rounded-lg bg-emergency/5 border-emergency/20">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium">{call.callType}</div>
                        <div className="text-sm text-muted-foreground">{call.callerLocation}</div>
                      </div>
                      <Badge variant={getPriorityBadgeVariant(call.priority)}>
                        {call.priority}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      Caller: {call.callerId}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleAcceptCall(call)}
                        className="flex-1"
                      >
                        {t('Accept')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeclineCall(call.id)}
                      >
                        {t('Decline')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Call History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
              <CardTitle>{t('Recent Calls')}</CardTitle>
              <CardDescription>Call history and outcomes</CardDescription>
              <CardDescription>{t('Call history and outcomes')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calls.slice().reverse().slice(0, 8).map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        call.status === 'completed' ? 'bg-success' : 
                        call.status === 'active' ? 'bg-warning animate-pulse' : 'bg-muted'
                      }`}></div>
                      <div>
                        <div className="font-medium">{call.callType} - {call.callerLocation}</div>
                        <div className="text-sm text-muted-foreground">
                          {call.incidentId} • {new Date(call.startTime).toLocaleTimeString()}
                          {call.duration && ` • ${call.duration}s`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityBadgeVariant(call.priority)} className="text-xs">
                        {call.priority}
                      </Badge>
                      {call.audioRecording && (
                        <Button size="sm" variant="outline" className="gap-1">
                          <FileAudio className="h-3 w-3" />
                          {t('Audio')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Call Modal */}
      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-success" />
              {t('Active Call')}: {activeCall?.callType}
            </DialogTitle>
            <DialogDescription>
              {activeCall?.callerLocation} • {t('Incident')}: {activeCall?.incidentId}
            </DialogDescription>
          </DialogHeader>
          
          {activeCall && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Caller ID</label>
                  <label className="text-sm font-medium">{t('Caller ID')}</label>
                  <div className="text-sm">{activeCall.callerId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <label className="text-sm font-medium">{t('Priority')}</label>
                  <Badge variant={getPriorityBadgeVariant(activeCall.priority)}>
                    {activeCall.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Call Duration</label>
                <label className="text-sm font-medium">{t('Call Duration')}</label>
                <div className="text-lg font-mono">
                  {Math.floor((Date.now() - new Date(activeCall.startTime).getTime()) / 1000)}s
                </div>
              </div>

              <div className="flex justify-center gap-4 py-4">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={handleStartRecording}
                  className="gap-2"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isRecording ? t('Stop Recording') : t('Start Recording')}
                </Button>
                
                <Button variant="outline" className="gap-2">
                  <Volume2 className="h-4 w-4" />
                  {t('Audio Controls')}
                </Button>
                
                <Button onClick={handleDispatchUnit} className="gap-2">
                  <Send className="h-4 w-4" />
                  {t('Dispatch Unit')}
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">Call Notes & Summary</label>
                <label className="text-sm font-medium">{t('Call Notes & Summary')}</label>
                <Textarea
                  placeholder={t('Enter call summary, actions taken, and any important details...')}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="mt-2 min-h-24"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCallModal(false)}>
                  {t('Minimize')}
                </Button>
                <Button variant="destructive" onClick={handleEndCall}>
                  {t('End Call')}
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => toast({title: t('STT Summary'), description: t('Speech-to-text summary generated for this call.')})}>{t('STT/Summarize')}</Button>
                <Button variant="outline" size="sm" onClick={() => toast({title: t('Audio Uploaded'), description: t('Audio file uploaded for this call.')})}>{t('Upload Audio')}</Button>
              </div>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};