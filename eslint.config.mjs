import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginVue from 'eslint-plugin-vue'

export default tseslint.config(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      // 关闭：要求 props 有默认值
      'vue/require-default-prop': 'off',
      // 关闭：要求组件名称是多个单词
      'vue/multi-word-component-names': 'off',
      // 添加 Vue 属性排序规则
      'vue/attributes-order': [
        'error',
        {
          order: [
            // 定义属性 (如 is, ref, key)
            'DEFINITION',
            // 列表渲染属性 (如 v-for)
            'LIST_RENDERING',
            // 条件渲染属性 (如 v-if, v-else-if, v-else, v-show)
            'CONDITIONALS',
            // 渲染修饰符 (如 v-once, v-pre)
            'RENDER_MODIFIERS',
            // 全局属性 (如 id, class, style)
            'GLOBAL',
            // 唯一属性和插槽 (如 ref, slot, slot-scope)
            ['UNIQUE', 'SLOT'],
            // 双向绑定 (如 v-model)
            'TWO_WAY_BINDING',
            // 其他指令 (如 v-custom)
            'OTHER_DIRECTIVES',
            // 其他属性 (如 custom-prop, :prop)
            'OTHER_ATTR',
            // 事件处理 (如 @click, @input)
            'EVENTS',
            // 内容 (如 v-text, v-html)
            'CONTENT'
          ],
          alphabetical: false
        }
      ],
      // 每行最大属性数
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: {
            max: 3
          },
          multiline: {
            max: 1
          }
        }
      ],
      // HTML 自闭合标签规则
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'never',
            normal: 'always',
            component: 'always'
          }
        }
      ],
      // 添加以下规则以忽略常见警告
      // 关闭：禁止无效的 href 属性
      'vue/no-invalid-href': 'off',
      // 警告：未使用的变量
      'vue/no-unused-vars': 'warn',
      // 警告：未使用的变量，忽略以下划线开头的参数和变量
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      // 关闭：要求函数有明确的返回类型
      '@typescript-eslint/explicit-function-return-type': 'off',
      // 关闭：禁止使用 any 类型
      '@typescript-eslint/no-explicit-any': 'off',
      // 关闭：禁止使用非空断言
      '@typescript-eslint/no-non-null-assertion': 'off',
      // 关闭：禁止使用 @ts-ignore 等注释
      '@typescript-eslint/ban-ts-comment': 'off',
      // 警告：v-on 指令验证
      'vue/valid-v-on': 'warn'
    }
  },
  eslintConfigPrettier
)
