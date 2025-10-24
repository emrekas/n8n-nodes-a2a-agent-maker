import { z, ZodSchema, ZodType } from 'zod';

/**
 * Interface for input field configuration
 */
export interface InputFieldConfig {
	fieldName: string;
	fieldType: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'array';
	required: boolean;
}

/**
 * Creates a Zod schema based on the input field configuration
 */
export function createValidationSchema(inputFields: InputFieldConfig[]): ZodSchema {
	const schemaShape: Record<string, ZodType> = {};

	for (const field of inputFields) {
		let fieldSchema: ZodType;

		// Create the base schema based on field type
		switch (field.fieldType) {
			case 'text':
				fieldSchema = z.string();
				break;
			case 'number':
				fieldSchema = z.number();
				break;
			case 'boolean':
				fieldSchema = z.boolean();
				break;
			case 'date':
				fieldSchema = z.string().datetime({ offset: true }).or(z.date());
				break;
			case 'json':
				fieldSchema = z.record(z.string(), z.any());
				break;
			case 'array':
				fieldSchema = z.array(z.any());
				break;
			default:
				fieldSchema = z.any();
		}

		// Make the field optional if not required
		if (!field.required) {
			fieldSchema = fieldSchema.optional();
		}

		schemaShape[field.fieldName] = fieldSchema;
	}

	return z.object(schemaShape);
}

/**
 * Validates input data against the configured fields
 */
export function validateInputFields(
	inputData: Record<string, any>,
	inputFields: InputFieldConfig[]
): { valid: boolean; errors?: string[]; data?: Record<string, any> } {
	if (!inputFields || inputFields.length === 0) {
		return { valid: true, data: inputData };
	}

	try {
		const schema = createValidationSchema(inputFields);
		const validatedData = schema.parse(inputData) as Record<string, any>;
		return { valid: true, data: validatedData };
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err: z.ZodIssue) => {
				const path = err.path.join('.');
				return `${path}: ${err.message}`;
			});
			return { valid: false, errors };
		}
		return { valid: false, errors: ['Unknown validation error'] };
	}
}

/**
 * Parses input fields from either JSON or field configuration format
 */
export function parseInputFields(defineInputFields: string, inputFieldsJson?: string, inputFields?: any): InputFieldConfig[] {
	if (defineInputFields === 'json' && inputFieldsJson) {
		try {
			const parsed = JSON.parse(inputFieldsJson);
			return Array.isArray(parsed) ? parsed : [];
		} catch (error) {
			throw new Error(`Invalid JSON in input fields: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	if (defineInputFields === 'fields' && inputFields?.values) {
		return inputFields.values.map((field: any) => ({
			fieldName: field.fieldName,
			fieldType: field.fieldType,
			required: field.required || false,
		}));
	}

	return [];
}

/**
 * Formats validation errors into a user-friendly message
 */
export function formatValidationErrors(errors: string[]): string {
	const header = 'Input validation failed. The following fields have errors:';
	const errorList = errors.map((err, idx) => `  ${idx + 1}. ${err}`).join('\n');
	return `${header}\n${errorList}`;
}

