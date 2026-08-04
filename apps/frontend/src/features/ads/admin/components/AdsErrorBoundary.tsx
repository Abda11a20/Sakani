'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AdsErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in Ads Subsystem:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-status-danger/30 bg-status-danger/5 my-4 font-cairo">
          <div className="flex items-center gap-3 text-status-danger mb-2">
            <AlertCircle size={20} />
            <h4 className="font-bold text-sm">
              {this.props.fallbackTitle || 'حدث خطأ في عرض هذا الجزء من الإعلانات'}
            </h4>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            {this.state.error?.message || 'تعذر تحميل هذا القسم بشكل صحيح، يمكنك المحاولة مرة أخرى.'}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleReset} leftIcon={<RefreshCcw size={14} />}>
            إعادة المحاولة
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}
