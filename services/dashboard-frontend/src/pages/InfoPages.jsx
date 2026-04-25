import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, Shield, Cpu, Layers, Globe, BarChart3, Database } from 'lucide-react';

// Common Page Header
const PageHeader = ({ title, subtitle }) => (
  <div className="mb-16 text-center">
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-5xl font-bold text-white mb-4"
    >
      {title}
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-xl text-text-secondary max-w-2xl mx-auto"
    >
      {subtitle}
    </motion.p>
  </div>
);

// Features Page
export const Features = () => (
  <div className="pt-32 pb-20 container">
    <PageHeader 
      title="Platform Features" 
      subtitle="Advanced observability powered by machine learning and high-throughput streaming." 
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <FeatureCard 
        icon={<Cpu />} 
        title="AI Anomaly Detection" 
        desc="Our proprietary Isolation Forest implementation scores every log entry in real-time, detecting deviations before they trigger traditional alerts." 
      />
      <FeatureCard 
        icon={<Activity />} 
        title="Live Log Streaming" 
        desc="Powered by Apache Kafka, we handle millions of events per second with sub-second latency from ingestion to visualization." 
      />
      <FeatureCard 
        icon={<Layers />} 
        title="Unified Dashboard" 
        desc="A single pane of glass for logs, metrics, and security events across your entire cloud-native infrastructure." 
      />
      <FeatureCard 
        icon={<Zap />} 
        title="Predictive Scaling" 
        desc="Identify traffic spikes and resource exhaustion patterns automatically using our historical trend analysis engine." 
      />
      <FeatureCard 
        icon={<Globe />} 
        title="Multi-Cloud Native" 
        desc="Seamless integration with AWS, Azure, and GCP. Deploy anywhere with our lightweight containerized agents." 
      />
      <FeatureCard 
        icon={<Database />} 
        title="Scalable Cold Storage" 
        desc="Archive petabytes of logs to S3 or GCS with automated lifecycle policies and instant searchable retrieval." 
      />
    </div>
  </div>
);

// Workflow Page
export const Workflow = () => (
  <div className="pt-32 pb-20 container">
    <PageHeader 
      title="System Workflow" 
      subtitle="How LogSentinel processes your data from the edge to the console." 
    />
    <div className="max-w-4xl mx-auto space-y-12">
      <Step icon="01" title="Ingestion" desc="Logs are collected via Fluentd or our REST API and validated against strictly defined Pydantic schemas." />
      <Step icon="02" title="Streaming" desc="Validated logs are published to Apache Kafka, ensuring durability and high availability even during traffic spikes." />
      <Step icon="03" title="Processing" desc="Kafka consumers clean, structure, and enrich logs with metadata before indexing into Elasticsearch." />
      <Step icon="04" title="AI Inference" desc="The ML Engine analyzes log patterns using Isolation Forest to detect statistical anomalies." />
      <Step icon="05" title="Alerting" desc="Anomalies are deduplicated in Redis and routed to Slack, Email, or PagerDuty based on severity." />
    </div>
  </div>
);

// Security Page
export const Security = () => (
  <div className="pt-32 pb-20 container">
    <PageHeader 
      title="Enterprise Security" 
      subtitle="Built-in protection for your sensitive log data and infrastructure." 
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="glass rounded-3xl p-10 border-white/5">
        <Shield className="text-accent-red w-12 h-12 mb-6" />
        <h3 className="text-2xl font-bold text-white mb-4">Zero-Trust Architecture</h3>
        <p className="text-text-secondary leading-relaxed">
          LogSentinel implements strict IAM roles and service-to-service authentication. All data is encrypted at rest using AES-256 and in transit via TLS 1.3.
        </p>
      </div>
      <div className="glass rounded-3xl p-10 border-white/5">
        <Globe className="text-accent-orange w-12 h-12 mb-6" />
        <h3 className="text-2xl font-bold text-white mb-4">Compliance Ready</h3>
        <p className="text-text-secondary leading-relaxed">
          Maintain SOC2, HIPAA, and GDPR compliance with our automated log auditing, access controls, and data residency configurations.
        </p>
      </div>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="glass rounded-[2rem] p-8 hover:bg-white/[0.05] transition-all group">
    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon, { size: 24, className: 'text-accent-red' })}
    </div>
    <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
    <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
  </div>
);

const Step = ({ icon, title, desc }) => (
  <div className="flex gap-8 items-start">
    <div className="text-5xl font-black text-white/10 tracking-tighter shrink-0">{icon}</div>
    <div className="pt-2">
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-text-secondary text-lg">{desc}</p>
    </div>
  </div>
);
