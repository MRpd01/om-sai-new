"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChefHat, Plus, Edit, Trash2, Calendar, Clock, Users, ArrowLeft, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createMenu, createMenuItem, fetchMenu, fetchMenusForMess } from '@/lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  price?: number;
}

interface DailyMenu {
  id: string;
  date: string;
  breakfast: MenuItem[];
  lunch: MenuItem[];
  dinner: MenuItem[];
  snacks: MenuItem[];
}

export default function MenuPage() {
  const { user, loading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [editingMenu, setEditingMenu] = useState<DailyMenu | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    type: 'lunch',
    description: '',
    price: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    (async () => {
      // attempt to fetch menu for current user's mess
      try {
        const messId = (user?.user_metadata as any)?.mess_id || '';
        if (!messId) throw new Error('no-mess-id');
        const res = await fetchMenu(messId as string, selectedDate);
        if (res.error || !res.data) {
          // fallback to empty
          setDailyMenus([]);
          return;
        }

        const m = res.data as any;
        const grouped: DailyMenu = {
          id: m.id,
          date: m.menu_date,
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        };

        // place all items into lunch by default unless you add a type column
        (m.menu_items || []).forEach((it: any) => {
          grouped.lunch.push({ id: it.id, name: it.name, type: 'lunch', description: it.description || '', price: Number(it.price) || 0 });
        });

        setDailyMenus([grouped]);
      } catch (err) {
        // fallback to empty data
        setDailyMenus([]);
      }
    })();
  }, [user, selectedDate]);

  const userRole = user?.user_metadata?.role || 'user';
  const currentMenu = dailyMenus.find(menu => menu.date === selectedDate);

  const handleAddMenuItem = () => {
    if (!newItem.name || !editingMenu) return;

    const menuItem: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      type: newItem.type as MenuItem['type'],
      description: newItem.description || '',
      price: newItem.price || 0
    };

    (async () => {
      // If editingMenu.id is from DB (UUID), attempt to persist the item
      const looksLikeUUID = typeof editingMenu.id === 'string' && editingMenu.id.length === 36;
      if (looksLikeUUID) {
        try {
          const res = await createMenuItem(editingMenu.id, menuItem.name, menuItem.description, menuItem.type !== 'snack', menuItem.price || 0, undefined);
          if (res.error) throw res.error;
          const created = res.data as any;
          // push into UI using returned id
          const createdItem: MenuItem = { id: created.id, name: created.name, type: newItem.type as MenuItem['type'], description: created.description || '', price: Number(created.price) || 0 };
          const updatedMenu = { ...editingMenu };
          if (newItem.type === 'breakfast') updatedMenu.breakfast.push(createdItem);
          else if (newItem.type === 'lunch') updatedMenu.lunch.push(createdItem);
          else if (newItem.type === 'dinner') updatedMenu.dinner.push(createdItem);
          else if (newItem.type === 'snack') updatedMenu.snacks.push(createdItem);
          setEditingMenu(updatedMenu);
        } catch (err) {
          // fallback to in-memory
          const updatedMenu = { ...editingMenu };
          if (newItem.type === 'breakfast') updatedMenu.breakfast.push(menuItem);
          else if (newItem.type === 'lunch') updatedMenu.lunch.push(menuItem);
          else if (newItem.type === 'dinner') updatedMenu.dinner.push(menuItem);
          else if (newItem.type === 'snack') updatedMenu.snacks.push(menuItem);
          setEditingMenu(updatedMenu);
        }
      } else {
        // in-memory fallback
        const updatedMenu = { ...editingMenu };
        if (newItem.type === 'breakfast') updatedMenu.breakfast.push(menuItem);
        else if (newItem.type === 'lunch') updatedMenu.lunch.push(menuItem);
        else if (newItem.type === 'dinner') updatedMenu.dinner.push(menuItem);
        else if (newItem.type === 'snack') updatedMenu.snacks.push(menuItem);
        setEditingMenu(updatedMenu);
      }

      setNewItem({ name: '', type: 'lunch', description: '', price: 0 });
      setIsAddingItem(false);
    })();
  };

  const handleRemoveMenuItem = (itemId: string, type: MenuItem['type']) => {
    if (!editingMenu) return;

    const updatedMenu = { ...editingMenu };
    if (type === 'breakfast') {
      updatedMenu.breakfast = updatedMenu.breakfast.filter(item => item.id !== itemId);
    } else if (type === 'lunch') {
      updatedMenu.lunch = updatedMenu.lunch.filter(item => item.id !== itemId);
    } else if (type === 'dinner') {
      updatedMenu.dinner = updatedMenu.dinner.filter(item => item.id !== itemId);
    } else if (type === 'snack') {
      updatedMenu.snacks = updatedMenu.snacks.filter(item => item.id !== itemId);
    }

    setEditingMenu(updatedMenu);
  };

  const handleSaveMenu = () => {
    if (!editingMenu) return;

    setDailyMenus(prev => {
      const existing = prev.findIndex(menu => menu.date === editingMenu.date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = editingMenu;
        return updated;
      } else {
        return [...prev, editingMenu];
      }
    });

    setEditingMenu(null);
  };

  const startEditingMenu = () => {
    if (currentMenu) {
      setEditingMenu({ ...currentMenu });
    } else {
      // Create new menu for the selected date (persist to Supabase if possible)
      (async () => {
        try {
          const messId = (user?.user_metadata as any)?.mess_id || '';
          const res = await createMenu(messId as string, selectedDate, `${new Date(selectedDate).toLocaleDateString()} Menu`, undefined);
          if (res.error) throw res.error;
          // res.data contains the created menu row
          const created = res.data as any;
          const newMenu: DailyMenu = {
            id: created.id,
            date: created.menu_date,
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          };
          setDailyMenus(prev => [...prev, newMenu]);
          setEditingMenu(newMenu);
        } catch (err) {
          // fallback to mock in-memory menu
          const newMenu: DailyMenu = {
            id: Date.now().toString(),
            date: selectedDate,
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          };
          setDailyMenus(prev => [...prev, newMenu]);
          setEditingMenu(newMenu);
        }
      })();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-orange-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderMenuSection = (title: string, items: MenuItem[], type: MenuItem['type'], isEditing: boolean = false) => (
    <Card className="border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-orange-900 flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
          {isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewItem({ ...newItem, type });
                setIsAddingItem(true);
              }}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-orange-500 text-sm italic">No items planned for {title.toLowerCase()}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-orange-900">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-orange-600">{item.description}</p>
                  )}
                  {item.price && (
                    <p className="text-sm font-medium text-green-600">₹{item.price}</p>
                  )}
                </div>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveMenuItem(item.id, type)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="p-2 bg-orange-600 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-orange-900">
                  {language === 'en' ? 'Menu Management' : 'मेनू व्यवस्थापन'}
                </h1>
                <p className="text-sm text-orange-600">Plan and manage daily menus</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              {userRole === 'admin' && (
                <div className="flex space-x-2">
                  <Button
                    variant={activeTab === 'view' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('view')}
                    className={activeTab === 'view' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-200 text-orange-600'}
                  >
                    View Menu
                  </Button>
                  <Button
                    variant={activeTab === 'manage' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('manage')}
                    className={activeTab === 'manage' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-200 text-orange-600'}
                  >
                    Manage Menu
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Selector */}
        <div className="mb-6">
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-orange-900">Select Date:</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto border-orange-200 focus:border-orange-400"
                />
                {userRole === 'admin' && activeTab === 'manage' && !editingMenu && (
                  <Button
                    onClick={startEditingMenu}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {currentMenu ? 'Edit Menu' : 'Create Menu'}
                  </Button>
                )}
                {editingMenu && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveMenu}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Menu
                    </Button>
                    <Button
                      onClick={() => setEditingMenu(null)}
                      variant="outline"
                      className="border-orange-200 text-orange-600"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Content */}
        <div className="space-y-6">
          {!currentMenu && !editingMenu ? (
            <Card className="border-orange-200">
              <CardContent className="p-8 text-center">
                <ChefHat className="h-16 w-16 text-orange-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-orange-900 mb-2">No Menu Planned</h3>
                <p className="text-orange-600 mb-4">
                  No menu has been planned for {new Date(selectedDate).toLocaleDateString()}.
                </p>
                {userRole === 'admin' && (
                  <Button
                    onClick={startEditingMenu}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Menu for This Date
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderMenuSection(
                language === 'en' ? 'Breakfast' : 'नाश्ता',
                editingMenu ? editingMenu.breakfast : (currentMenu?.breakfast || []),
                'breakfast',
                !!editingMenu
              )}
              {renderMenuSection(
                language === 'en' ? 'Lunch' : 'दुपारचे जेवण',
                editingMenu ? editingMenu.lunch : (currentMenu?.lunch || []),
                'lunch',
                !!editingMenu
              )}
              {renderMenuSection(
                language === 'en' ? 'Dinner' : 'रात्रीचे जेवण',
                editingMenu ? editingMenu.dinner : (currentMenu?.dinner || []),
                'dinner',
                !!editingMenu
              )}
              {renderMenuSection(
                language === 'en' ? 'Snacks' : 'नाश्ता',
                editingMenu ? editingMenu.snacks : (currentMenu?.snacks || []),
                'snack',
                !!editingMenu
              )}
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        {isAddingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-orange-900">Add Menu Item</CardTitle>
                <CardDescription>Add a new item to the menu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-orange-900">Item Name</label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Enter item name"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-orange-900">Description</label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Enter description"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-orange-900">Price (₹)</label>
                  <Input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    placeholder="Enter price"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-orange-900">Meal Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as MenuItem['type'] })}
                    className="w-full p-2 border border-orange-200 rounded-md focus:border-orange-400"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snacks</option>
                  </select>
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleAddMenuItem}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    Add Item
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingItem(false);
                      setNewItem({ name: '', type: 'lunch', description: '', price: 0 });
                    }}
                    variant="outline"
                    className="flex-1 border-orange-200 text-orange-600"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Menu Statistics */}
        {(currentMenu || editingMenu) && (
          <div className="mt-8">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-900 flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Menu Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {(editingMenu || currentMenu)?.breakfast.length || 0}
                    </div>
                    <p className="text-sm text-orange-500">Breakfast Items</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {(editingMenu || currentMenu)?.lunch.length || 0}
                    </div>
                    <p className="text-sm text-orange-500">Lunch Items</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {(editingMenu || currentMenu)?.dinner.length || 0}
                    </div>
                    <p className="text-sm text-orange-500">Dinner Items</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {(editingMenu || currentMenu)?.snacks.length || 0}
                    </div>
                    <p className="text-sm text-orange-500">Snack Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}