import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Switch,
} from '@/shared/ui/shadcn';
import { defaultOpticutInput } from './lib/defaultOpticutData';
import useStore, { useOptions } from './model/store';

const settingsSchema = z.object({
  minWaste: z.boolean(),
  maxUtilization: z.boolean(),
  smartPack: z.boolean(),
  useInfiniteMaterials: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const OptimizerSettingsForm = () => {
  const store = useStore();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...defaultOpticutInput().data.options,
    },
  });

  const options = useOptions(); // Gets the current options from the store

  // Initialize form with store values
  useEffect(() => {
    form.reset(options);
  }, []);

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      const values = value as SettingsFormValues;
      store.setOptions(values);
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  return (
    <div className="max-w-lg flex-1">
      <Card>
        <CardHeader>
          <CardTitle>Параметры</CardTitle>
          <CardDescription>Настройки оптимизатора</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="minWaste"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Минимальный отход</FormLabel>
                      <FormDescription>Режим минимального отхода</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxUtilization"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Максимальная загрузка</FormLabel>
                      <FormDescription>Режим максимальной загрузки</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="smartPack"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Умный режим</FormLabel>
                      <FormDescription></FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="useInfiniteMaterials"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Бесконечные материалы</FormLabel>
                      <FormDescription>
                        Использовать неограниченное количество материалов
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizerSettingsForm;
