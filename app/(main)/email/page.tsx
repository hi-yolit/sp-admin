// app/email/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    Input,
    Button,
    Textarea,
    Checkbox,
    CheckboxGroup,
    Select,
    SelectItem,
    Tabs,
    Tab
} from "@nextui-org/react";
import { Send } from 'lucide-react';

interface Business {
    id: string;
    name: string;
    subscription: {
        status: string;
    } | null;
    owner: {
        id: string;
        email: string;
        name: string | null;
    };
}

interface User {
    emailVerified: boolean;
    id: string;
    email: string;
    name: string | null;
    ownedBusinesses: {
        id: string;
        name: string;
        subscription: {
            status: string;
        } | null;
    }[];
}

interface EmailTemplate {
    subject: string;
    body: string;
}

export default function EmailPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [subject, setSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [sending, setSending] = useState(false);
    const [filterType, setFilterType] = useState("all");
    const [selectedTab, setSelectedTab] = useState("users");

    const templates: Record<string, EmailTemplate> = {
        "Welcome Message": {
            subject: "Welcome to SalesPath",
            body: "Hi {{name}},\n\nWelcome to SalesPath! We're excited to have you on board.",
        },
        "Subscription Status": {
            subject: "Your SalesPath Subscription Status",
            body: "Hi {{name}},\n\nThis is regarding your subscription for {{businessName}}. {{status}}",
        },
        "Business Reminder": {
            subject: "Complete Your SalesPath Setup",
            body: "Hi {{name}},\n\nWe noticed you haven't set up your business on SalesPath yet. Would you like help getting started?",
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersResponse, businessesResponse] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/businesses')
            ]);

            if (!usersResponse.ok || !businessesResponse.ok)
                throw new Error('Failed to fetch data');

            const userData = await usersResponse.json();
            const businessData = await businessesResponse.json();

            setUsers(userData);
            setBusinesses(businessData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const getUserFilters = () => [
        { key: "all", label: "All Users" },
        { key: "no_business", label: "Users without Business" },
        { key: "verified", label: "Verified Users" },
        { key: "unverified", label: "Unverified Users" },
    ];

    const getBusinessFilters = () => [
        { key: "all", label: "All Businesses" },
        { key: "trial", label: "Trial Subscriptions" },
        { key: "active", label: "Active Subscriptions" },
        { key: "expired", label: "Expired Subscriptions" },
        { key: "cancelled", label: "Cancelled Subscriptions" },
        { key: "past_due", label: "Past Due Subscriptions" },
    ];

    const filterItems = (filterType: string): User[] | Business[] => {
        if (selectedTab === "users") {
            switch (filterType) {
                case "no_business":
                    return users.filter(user => user.ownedBusinesses.length === 0);
                case "verified":
                    return users.filter(user => user.emailVerified);
                case "unverified":
                    return users.filter(user => !user.emailVerified);
                default:
                    return users;
            }
        } else {
            if (filterType === "all") return businesses;
            return businesses.filter(business =>
                business.subscription?.status.toLowerCase() === filterType
            );
        }
    };

    const renderUserCheckboxes = (users: User[]) => {
        return users.map((user) => (
            <Checkbox key={user.id} value={user.id} className="p-2">
                <div className="flex flex-col">
                    <span>{user.email}</span>
                    <span className="text-xs text-gray-500">
                        {user.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                    {user.ownedBusinesses?.length > 0 && (
                        <span className="text-xs text-gray-500">
                            Businesses: {user.ownedBusinesses.map(b => b.name).join(', ')}
                        </span>
                    )}
                </div>
            </Checkbox>
        ));
    };

    const renderBusinessCheckboxes = (businesses: Business[]) => {
        return businesses.map((business) => (
            <Checkbox key={business.id} value={business.id} className="p-2">
                <div className="flex flex-col">
                    <span>{business.name}</span>
                    <span className="text-xs text-gray-500">
                        Owner: {business?.owner?.email}
                    </span>
                    <span className="text-xs text-gray-500">
                        Status: {business.subscription?.status ?? 'No subscription'}
                    </span>
                </div>
            </Checkbox>
        ));
    };

    const handleFilterChange = (value: string) => {
        setFilterType(value);
        const filtered = filterItems(value);
        setSelectedRecipients(filtered.map(item => item.id));
    };

    const handleSendEmail = async () => {
        if (!subject || !emailBody || selectedRecipients.length === 0) {
            alert('Please fill in all fields and select recipients');
            return;
        }

        setSending(true);
        try {
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: selectedTab,
                    recipientIds: selectedRecipients,
                    subject,
                    body: emailBody,
                }),
            });

            if (!response.ok) throw new Error('Failed to send emails');

            alert('Emails sent successfully!');
            setSubject('');
            setEmailBody('');
            setSelectedRecipients([]);
        } catch (error) {
            console.error('Error sending emails:', error);
            alert('Failed to send emails');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Email Management</h1>

            <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => {
                    setSelectedTab(key.toString());
                    setFilterType("all");
                    setSelectedRecipients([]);
                }}
            >
                <Tab key="users" title="Users">
                    <Card className="p-4 mt-4">
                        <h2 className="text-lg font-medium mb-4">Select Users</h2>
                        <div className="space-y-4">
                            <Select
                                label="Filter Users"
                                value={filterType}
                                onChange={(e) => handleFilterChange(e.target.value)}
                            >
                                {getUserFilters().map(filter => (
                                    <SelectItem key={filter.key} value={filter.key}>
                                        {filter.label}
                                    </SelectItem>
                                ))}
                            </Select>

                            <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Selected: {selectedRecipients.length} users
                                </p>
                                <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                                    <CheckboxGroup
                                        value={selectedRecipients}
                                        onChange={(values) => setSelectedRecipients(values as string[])}
                                    >
                                        {renderUserCheckboxes(filterItems(filterType) as User[])}
                                    </CheckboxGroup>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Tab>

                <Tab key="businesses" title="Businesses">
                    <Card className="p-4 mt-4">
                        <h2 className="text-lg font-medium mb-4">Select Businesses</h2>
                        <div className="space-y-4">
                            <Select
                                label="Filter by Subscription Status"
                                value={filterType}
                                onChange={(e) => handleFilterChange(e.target.value)}
                            >
                                {getBusinessFilters().map(filter => (
                                    <SelectItem key={filter.key} value={filter.key}>
                                        {filter.label}
                                    </SelectItem>
                                ))}
                            </Select>

                            <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Selected: {selectedRecipients.length} businesses
                                </p>
                                <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                                    <CheckboxGroup
                                        value={selectedRecipients}
                                        onChange={(values) => setSelectedRecipients(values as string[])}
                                    >
                                        {renderBusinessCheckboxes(filterItems(filterType) as Business[])}
                                    </CheckboxGroup>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Tab>
            </Tabs>

            <Card className="p-4">
                <h2 className="text-lg font-medium mb-4">Email Content</h2>
                <div className="space-y-4">
                    <Select
                        label="Use Template"
                        onChange={(e) => {
                            const template = templates[e.target.value];
                            if (template) {
                                setSubject(template.subject);
                                setEmailBody(template.body);
                            }
                        }}
                    >
                        {Object.keys(templates).map((name) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </Select>

                    <Input
                        label="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject"
                    />

                    <Textarea
                        label="Message"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Enter email content"
                        minRows={5}
                    />

                    <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
                        <p>Available variables:</p>
                        <ul className="list-disc list-inside mt-1">
                            <li>{"{{name}}"} - Recipient's name</li>
                            {selectedTab === "businesses" && (
                                <>
                                    <li>{"{{businessName}}"} - Business name</li>
                                    <li>{"{{status}}"} - Subscription status</li>
                                </>
                            )}
                        </ul>
                    </div>

                    <Button
                        color="primary"
                        onClick={handleSendEmail}
                        isLoading={sending}
                        startContent={!sending && <Send size={18} />}
                        className="w-full sm:w-auto"
                        isDisabled={sending || selectedRecipients.length === 0}
                    >
                        {sending ? 'Sending...' : 'Send Email'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}