import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Settings, 
  Database, 
  Cloud, 
  Webhook, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Save,
  TestTube,
  RefreshCw
} from 'lucide-react';

// Interfaces
interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  watchFolders: string[];
  autoProcess: boolean;
  notificationUrl: string;
}

interface N8nConfig {
  webhookUrl: string;
  apiKey: string;
  workflowId: string;
  retryAttempts: number;
  timeoutMs: number;
}

interface IntegrationSetting {
  id: string;
  integration_type: string;
  setting_key: string;
  setting_value: any;
  is_encrypted: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

const IntegrationSettings: React.FC = () => {
  const [googleDriveConfig, setGoogleDriveConfig] = useState<GoogleDriveConfig>({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    watchFolders: [],
    autoProcess: true,
    notificationUrl: ''
  });

  const [n8nConfig, setN8nConfig] = useState<N8nConfig>({
    webhookUrl: '',
    apiKey: '',
    workflowId: '',
    retryAttempts: 3,
    timeoutMs: 30000
  });

  const [allSettings, setAllSettings] = useState<IntegrationSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadAllSettings();
    loadGoogleDriveConfig();
    loadN8nConfig();
  }, []);

  const loadAllSettings = async () => {
    try {
      const response = await fetch('/api/integration-settings');
      if (response.ok) {
        const settings = await response.json();
        setAllSettings(settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const loadGoogleDriveConfig = async () => {
    try {
      const response = await fetch('/api/integration-settings/google-drive/config');
      if (response.ok) {
        const config = await response.json();
        setGoogleDriveConfig(prev => ({ ...prev, ...config }));
      }
    } catch (error) {
      console.error('Error loading Google Drive config:', error);
    }
  };

  const loadN8nConfig = async () => {
    try {
      const response = await fetch('/api/integration-settings/n8n/config');
      if (response.ok) {
        const config = await response.json();
        setN8nConfig(prev => ({ ...prev, ...config }));
      }
    } catch (error) {
      console.error('Error loading n8n config:', error);
    }
  };

  const saveGoogleDriveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integration-settings/google-drive/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(googleDriveConfig)
      });

      if (response.ok) {
        toast.success('Configuração do Google Drive salva com sucesso!');
        loadAllSettings();
      } else {
        throw new Error('Falha ao salvar configuração');
      }
    } catch (error) {
      console.error('Error saving Google Drive config:', error);
      toast.error('Erro ao salvar configuração do Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const testIntegration = async (integrationType: string, config: any) => {
    setTesting(integrationType);
    try {
      const response = await fetch(`/api/integration-settings/test/${integrationType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, [integrationType]: result }));
      
      if (result.success) {
        toast.success(`Teste de ${integrationType} realizado com sucesso!`);
      } else {
        toast.error(`Falha no teste de ${integrationType}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      toast.error(`Erro ao testar integração ${integrationType}`);
    } finally {
      setTesting(null);
    }
  };

  const toggleSettingActive = async (settingId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/integration-settings/${settingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        toast.success('Configuração atualizada!');
        loadAllSettings();
      }
    } catch (error) {
      console.error('Error toggling setting:', error);
      toast.error('Erro ao atualizar configuração');
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'google_drive':
        return <Cloud className="h-5 w-5" />;
      case 'n8n':
        return <Webhook className="h-5 w-5" />;
      case 'webhook':
        return <Database className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (isActive: boolean, testResult?: any) => {
    if (testResult) {
      return testResult.success ? 
        <CheckCircle className="h-4 w-4 text-green-500" /> : 
        <XCircle className="h-4 w-4 text-red-500" />;
    }
    return isActive ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações de Integração</h1>
          <p className="text-muted-foreground">
            Configure e gerencie as integrações do sistema
          </p>
        </div>
        <Button onClick={loadAllSettings} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="google-drive" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google-drive" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Google Drive
          </TabsTrigger>
          <TabsTrigger value="n8n" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            n8n
          </TabsTrigger>
          <TabsTrigger value="all-settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Todas as Configurações
          </TabsTrigger>
        </TabsList>

        {/* Google Drive Configuration */}
        <TabsContent value="google-drive">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Configuração do Google Drive
                {getStatusIcon(true, testResults.google_drive)}
              </CardTitle>
              <CardDescription>
                Configure a integração com o Google Drive para processamento automático de planilhas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={googleDriveConfig.clientId}
                    onChange={(e) => setGoogleDriveConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="Google OAuth Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={googleDriveConfig.clientSecret}
                    onChange={(e) => setGoogleDriveConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                    placeholder="Google OAuth Client Secret"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirectUri">Redirect URI</Label>
                <Input
                  id="redirectUri"
                  value={googleDriveConfig.redirectUri}
                  onChange={(e) => setGoogleDriveConfig(prev => ({ ...prev, redirectUri: e.target.value }))}
                  placeholder="https://your-app.com/auth/callback"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationUrl">URL de Notificação</Label>
                <Input
                  id="notificationUrl"
                  value={googleDriveConfig.notificationUrl}
                  onChange={(e) => setGoogleDriveConfig(prev => ({ ...prev, notificationUrl: e.target.value }))}
                  placeholder="https://your-app.com/webhook/google-drive"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoProcess"
                  checked={googleDriveConfig.autoProcess}
                  onCheckedChange={(checked) => setGoogleDriveConfig(prev => ({ ...prev, autoProcess: checked }))}
                />
                <Label htmlFor="autoProcess">Processamento Automático</Label>
              </div>

              {testResults.google_drive && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {testResults.google_drive.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={saveGoogleDriveConfig} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Configuração'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testIntegration('google_drive', googleDriveConfig)}
                  disabled={testing === 'google_drive'}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {testing === 'google_drive' ? 'Testando...' : 'Testar Conexão'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* n8n Configuration */}
        <TabsContent value="n8n">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Configuração do n8n
                {getStatusIcon(true, testResults.n8n)}
              </CardTitle>
              <CardDescription>
                Configure a integração com n8n para automação de workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    value={n8nConfig.webhookUrl}
                    onChange={(e) => setN8nConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-n8n.com/webhook/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflowId">ID do Workflow</Label>
                  <Input
                    id="workflowId"
                    value={n8nConfig.workflowId}
                    onChange={(e) => setN8nConfig(prev => ({ ...prev, workflowId: e.target.value }))}
                    placeholder="workflow-id"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={n8nConfig.apiKey}
                  onChange={(e) => setN8nConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="n8n API Key"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retryAttempts">Tentativas de Retry</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    value={n8nConfig.retryAttempts}
                    onChange={(e) => setN8nConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeoutMs">Timeout (ms)</Label>
                  <Input
                    id="timeoutMs"
                    type="number"
                    value={n8nConfig.timeoutMs}
                    onChange={(e) => setN8nConfig(prev => ({ ...prev, timeoutMs: parseInt(e.target.value) }))}
                    min="1000"
                    max="300000"
                  />
                </div>
              </div>

              {testResults.n8n && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {testResults.n8n.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => {/* Implementar salvamento do n8n */}} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Configuração
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testIntegration('n8n', n8nConfig)}
                  disabled={testing === 'n8n'}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {testing === 'n8n' ? 'Testando...' : 'Testar Conexão'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Settings */}
        <TabsContent value="all-settings">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Configurações</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as configurações de integração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getIntegrationIcon(setting.integration_type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{setting.setting_key}</span>
                          <Badge variant={setting.integration_type === 'google_drive' ? 'default' : 'secondary'}>
                            {setting.integration_type}
                          </Badge>
                        </div>
                        {setting.description && (
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(setting.is_active)}
                      <Switch
                        checked={setting.is_active}
                        onCheckedChange={(checked) => toggleSettingActive(setting.id, checked)}
                      />
                    </div>
                  </div>
                ))}
                {allSettings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma configuração encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationSettings;