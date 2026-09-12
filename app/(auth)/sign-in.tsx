import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '@/components/layout/KeyboardAwareScrollView';
import { Button, TextField } from '@/components/ui';
import { useSignIn } from '@/features/auth/hooks/useAuth';
import { colors, spacing, typography } from '@/theme';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('올바른 이메일 형식이 아니에요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const signIn = useSignIn();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: FormValues) => {
    signIn.mutate(values, {
      onSuccess: () => router.replace('/'),
    });
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>로그인</Text>
      <Text style={styles.subtitle}>가입할 때 사용한 이메일로 로그인해요.</Text>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label="이메일"
              placeholder="student@example.com"
              required
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="비밀번호"
              placeholder="비밀번호"
              required
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errors.password?.message}
            />
          )}
        />
      </View>

      {signIn.isError ? (
        <Text style={styles.serverError} accessibilityLiveRegion="polite">
          {(signIn.error as Error).message}
        </Text>
      ) : null}

      <Button label="로그인" onPress={handleSubmit(onSubmit)} loading={signIn.isPending} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
  title: { ...typography.title1, color: colors.textPrimary },
  subtitle: { ...typography.body2, color: colors.textSecondary },
  form: { gap: spacing.md },
  serverError: { ...typography.body2, color: colors.danger },
});
