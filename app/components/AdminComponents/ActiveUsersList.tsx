'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ToggleStatusButton from '@/app/components/AdminComponents/toggle-status-button';

type ActiveUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  sponsorId: string | null;
  sponsorOrganization: string | null;
  driverId: string | null;
  driverPointsBalance: number | null;
  driverStatus: string | null;
  driverSponsorOrganization: string | null;
  driverSponsorOrganizations: string[];
  sponsorUserId?: string | null; // Add this if not present
  sponsorUserStatus?: string | null; // Add this if not present
  adminId?: string | null;
  adminStatus?: string | null;
};

interface ActiveUsersListProps {
  users: ActiveUser[];
}

const PAGE_SIZE = 15;

export default function ActiveUsersList({ users }: ActiveUsersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleMatches = roleFilter === 'all' || user.role.toLowerCase() === roleFilter;
      const searchMatches =
        normalizedSearch.length === 0 ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      
      const statusMatches = 
        statusFilter === 'all' || 
        user.driverStatus?.toLowerCase() === statusFilter;

      return roleMatches && searchMatches && statusMatches;
    });
  }, [users, roleFilter, statusFilter, normalizedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const displayedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const formatStatus = (status: string | null) => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <section className="w-full max-w-5xl bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">All Users</h2>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange = {handleSearchChange}
          className="w-full md:flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-400"
        />

        <select
          value={roleFilter}
          onChange = {handleRoleChange}
          className="w-full md:w-52 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        >
          <option value="all">All Roles</option>
          <option value="driver">Driver</option>
          <option value="sponsor">Sponsor</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange ={handleStatusChange}
          className="w-full md:w-48 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="dropped">Dropped</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Showing {displayedUsers.length} of {filteredUsers.length} users
        — Page {currentPage} of {totalPages}
      </p>

      {displayedUsers.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-gray-600">
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="py-3 pr-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="py-3 pr-4 text-sm font-semibold text-gray-700">Role</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="py-3 pr-4 text-sm text-gray-900">{user.name}</td>
                  <td className="py-3 pr-4 text-sm text-gray-700">{user.email}</td>
                  <td className="py-3 pr-4 text-sm text-gray-700">{formatRole(user.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-lg shadow-lg border border-gray-200 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">User Information</h3>

            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold text-gray-900">Name:</span> {selectedUser.name}</p>
              <p><span className="font-semibold text-gray-900">Email:</span> {selectedUser.email}</p>
              <p><span className="font-semibold text-gray-900">Role:</span> {formatRole(selectedUser.role)}</p>
              <p>
                <span className="font-semibold text-gray-900">Email Verified:</span>{' '}
                {selectedUser.emailVerified ? 'Yes' : 'No'}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Joined:</span>{' '}
                {new Date(selectedUser.createdAt).toLocaleDateString()}
              </p>

              {selectedUser.role.toLowerCase() === 'driver' && (
                <>
                  <p>
                    <span className="font-semibold text-gray-900">Driver ID:</span>{' '}
                    {selectedUser.driverId ?? 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Sponsor Organizations:</span>{' '}
                    {selectedUser.driverSponsorOrganizations.length > 0
                      ? selectedUser.driverSponsorOrganizations.join(', ')
                      : (selectedUser.driverSponsorOrganization ?? 'Unassigned')}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Points Balance:</span>{' '}
                    {selectedUser.driverPointsBalance ?? 0}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Status:</span>{' '}
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                      selectedUser.driverStatus === 'active' ? 'bg-green-100 text-green-800' :
                      selectedUser.driverStatus === 'disabled' ? 'bg-red-100 text-red-800' :
                      selectedUser.driverStatus === 'dropped' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {formatStatus(selectedUser.driverStatus)}
                    </span>
                  </p>

                  {/* NEW: Toggle Status Button for Drivers */}
                  {selectedUser.driverId && (
                    <div className="pt-3 space-y-3">
                      <ToggleStatusButton
                        profileId={selectedUser.driverId}
                        currentStatus={selectedUser.driverStatus || 'active'}
                        userType="driver"
                      />
                      <Link
                        href={`/admin/${selectedUser.driverId}`}
                        className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Edit Driver Profile
                      </Link>
                    </div>
                  )}
                </>
              )}

              {selectedUser.role.toLowerCase() === 'sponsor' && (
                <>
                  <p>
                    <span className="font-semibold text-gray-900">Sponsor ID:</span>{' '}
                    {selectedUser.sponsorId ?? 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Sponsor Organization:</span>{' '}
                    {selectedUser.sponsorOrganization ?? 'Unassigned'}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Status:</span>{' '}
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                      selectedUser.sponsorUserStatus === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formatStatus(selectedUser.sponsorUserStatus ?? null)}
                    </span>
                  </p>

                  {/* Toggle Status Button and Edit Button for Sponsors */}
                  {selectedUser.sponsorUserId && (
                    <div className="pt-3 space-y-3">
                      <ToggleStatusButton
                        profileId={selectedUser.sponsorUserId}
                        currentStatus={selectedUser.sponsorUserStatus || 'active'}
                        userType="sponsor"
                      />
                      <Link
                        href={`/admin/sponsor/${selectedUser.sponsorUserId}`}
                        className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Edit Sponsor Profile
                      </Link>
                    </div>
                  )}
                </>
              )}
              {selectedUser.role.toLowerCase() === 'admin' && (
                <>
                  <p>
                    <span className="font-semibold text-gray-900">Admin ID:</span>{' '}
                    {selectedUser.adminId ?? 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Status:</span>{' '}
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                      selectedUser.adminStatus === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formatStatus(selectedUser.adminStatus ?? null)}
                    </span>
                  </p>

                   { /* NEW: Toggle Status Button for Admins */ }
                  {selectedUser.adminId && (
                    <div className="pt-3">
                      <ToggleStatusButton
                        profileId={selectedUser.adminId}
                        currentStatus={selectedUser.adminStatus || 'active'} 
                        userType="admin" 
                      />
                    </div>
                  )}
                </> 
              )}
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="mt-6 w-full rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </section>
  );
}